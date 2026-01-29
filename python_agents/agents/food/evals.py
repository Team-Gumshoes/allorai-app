"""
Evaluation module for the Food Agent.
Uses LangSmith for running evaluations with custom datasets and evaluators.
"""
##todo test
import logging
from typing import Any

from langsmith import Client
from langsmith.evaluation import evaluate, LangChainStringEvaluator
from langchain_openai import ChatOpenAI

from python_agents.shared.config import settings
from agents.food.agent import FoodAgent, FOODIE_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Initialize LangSmith client
client = Client()


# ============================================================================
# Test Dataset
# ============================================================================

FOOD_EVAL_DATASET = [
    {
        "input": "I'm looking for Italian restaurants in NYC",
        "expected_output": "Italian restaurant recommendations in New York City",
        "tags": ["cuisine_search", "location_specific"],
    },
    {
        "input": "What's a good place for vegan food?",
        "expected_output": "Vegan restaurant or food recommendations",
        "tags": ["dietary_restriction", "vegan"],
    },
    {
        "input": "Recommend me the best pizza nearby",
        "expected_output": "Pizza restaurant recommendations",
        "tags": ["specific_food", "pizza"],
    },
    {
        "input": "I want spicy Thai food for dinner",
        "expected_output": "Thai restaurant recommendations with spicy options",
        "tags": ["cuisine_search", "thai", "spicy"],
    },
    {
        "input": "Where can I find good sushi?",
        "expected_output": "Sushi restaurant recommendations",
        "tags": ["specific_food", "sushi", "japanese"],
    },
    {
        "input": "I'm on a budget, what are some cheap eats?",
        "expected_output": "Affordable restaurant or food recommendations",
        "tags": ["budget", "cheap"],
    },
    {
        "input": "Best brunch spots for the weekend",
        "expected_output": "Brunch restaurant recommendations",
        "tags": ["meal_type", "brunch", "weekend"],
    },
    {
        "input": "I have a gluten allergy, where can I eat?",
        "expected_output": "Gluten-free restaurant or food recommendations",
        "tags": ["dietary_restriction", "gluten_free", "allergy"],
    },
    {
        "input": "Romantic dinner spot for anniversary",
        "expected_output": "Upscale romantic restaurant recommendations",
        "tags": ["occasion", "romantic", "dinner"],
    },
    {
        "input": "Quick lunch options near downtown",
        "expected_output": "Fast casual lunch recommendations",
        "tags": ["meal_type", "lunch", "quick", "location_specific"],
    },
]


# ============================================================================
# Custom Evaluators
# ============================================================================

def relevance_evaluator(run, example) -> dict:
    """
    Evaluates if the response is relevant to the food query.
    """
    output = run.outputs.get("output", "") if run.outputs else ""
    input_query = example.inputs.get("input", "")

    # Check for food-related keywords
    food_keywords = [
        "restaurant", "food", "eat", "cuisine", "dish", "menu",
        "chef", "dining", "meal", "taste", "flavor", "delicious",
        "recommend", "try", "serve", "cook", "recipe"
    ]

    output_lower = output.lower()
    has_food_content = any(keyword in output_lower for keyword in food_keywords)

    # Check if it addresses the query type
    query_lower = input_query.lower()
    addresses_query = False

    if "italian" in query_lower and ("italian" in output_lower or "pasta" in output_lower or "pizza" in output_lower):
        addresses_query = True
    elif "vegan" in query_lower and ("vegan" in output_lower or "plant" in output_lower):
        addresses_query = True
    elif "pizza" in query_lower and "pizza" in output_lower:
        addresses_query = True
    elif "thai" in query_lower and "thai" in output_lower:
        addresses_query = True
    elif "sushi" in query_lower and ("sushi" in output_lower or "japanese" in output_lower):
        addresses_query = True
    elif "budget" in query_lower or "cheap" in query_lower:
        addresses_query = "affordable" in output_lower or "budget" in output_lower or "cheap" in output_lower or "$" in output_lower
    elif "brunch" in query_lower and "brunch" in output_lower:
        addresses_query = True
    elif "gluten" in query_lower and ("gluten" in output_lower or "celiac" in output_lower):
        addresses_query = True
    elif "romantic" in query_lower and ("romantic" in output_lower or "intimate" in output_lower or "ambiance" in output_lower):
        addresses_query = True
    elif "lunch" in query_lower and ("lunch" in output_lower or "midday" in output_lower):
        addresses_query = True
    else:
        addresses_query = has_food_content

    score = 1.0 if (has_food_content and addresses_query) else 0.5 if has_food_content else 0.0

    return {
        "key": "relevance",
        "score": score,
        "comment": f"Food content: {has_food_content}, Addresses query: {addresses_query}"
    }


def helpfulness_evaluator(run, example) -> dict:
    """
    Evaluates if the response is helpful and actionable.
    """
    output = run.outputs.get("output", "") if run.outputs else ""

    # Check for actionable content
    actionable_indicators = [
        "try", "visit", "check out", "recommend", "suggest",
        "located", "address", "hours", "open", "call",
        "book", "reservation", "menu", "price", "rating"
    ]

    output_lower = output.lower()
    actionable_count = sum(1 for indicator in actionable_indicators if indicator in output_lower)

    # Check response length (too short might not be helpful)
    word_count = len(output.split())
    has_sufficient_detail = word_count >= 20

    # Calculate score
    if actionable_count >= 3 and has_sufficient_detail:
        score = 1.0
    elif actionable_count >= 1 and has_sufficient_detail:
        score = 0.7
    elif has_sufficient_detail:
        score = 0.5
    else:
        score = 0.3

    return {
        "key": "helpfulness",
        "score": score,
        "comment": f"Actionable indicators: {actionable_count}, Word count: {word_count}"
    }


def tone_evaluator(run, example) -> dict:
    """
    Evaluates if the response has a friendly, enthusiastic foodie tone.
    """
    output = run.outputs.get("output", "") if run.outputs else ""

    # Check for enthusiastic/friendly language
    enthusiastic_words = [
        "delicious", "amazing", "fantastic", "wonderful", "great",
        "love", "enjoy", "favorite", "best", "excellent",
        "perfect", "incredible", "awesome", "tasty", "yummy",
        "excited", "happy", "glad", "pleasure"
    ]

    output_lower = output.lower()
    enthusiasm_count = sum(1 for word in enthusiastic_words if word in output_lower)

    # Check for friendly greetings/closings
    has_friendly_tone = any(phrase in output_lower for phrase in [
        "hope", "enjoy", "let me know", "happy to help", "feel free"
    ])

    if enthusiasm_count >= 2 and has_friendly_tone:
        score = 1.0
    elif enthusiasm_count >= 1 or has_friendly_tone:
        score = 0.7
    else:
        score = 0.4

    return {
        "key": "tone",
        "score": score,
        "comment": f"Enthusiasm words: {enthusiasm_count}, Friendly tone: {has_friendly_tone}"
    }


# ============================================================================
# Evaluation Runner
# ============================================================================

async def run_food_agent(inputs: dict) -> dict:
    """
    Run the food agent for evaluation.
    """
    agent = FoodAgent()
    response = await agent.get_recommendation(inputs["input"])
    return {"output": response}


def sync_run_food_agent(inputs: dict) -> dict:
    """
    Synchronous wrapper for running the food agent.
    """
    import asyncio
    return asyncio.run(run_food_agent(inputs))


def create_eval_dataset(dataset_name: str = "food-agent-eval") -> str:
    """
    Create or update the evaluation dataset in LangSmith.

    Returns:
        Dataset ID
    """
    # Check if dataset exists
    datasets = list(client.list_datasets(dataset_name=dataset_name))

    if datasets:
        dataset = datasets[0]
        logger.info(f"Using existing dataset: {dataset_name}")
    else:
        dataset = client.create_dataset(
            dataset_name=dataset_name,
            description="Evaluation dataset for the Food Agent - tests various food recommendation scenarios"
        )
        logger.info(f"Created new dataset: {dataset_name}")

    # Add examples to dataset
    for example in FOOD_EVAL_DATASET:
        client.create_example(
            inputs={"input": example["input"]},
            outputs={"expected": example["expected_output"]},
            metadata={"tags": example["tags"]},
            dataset_id=dataset.id
        )

    logger.info(f"Added {len(FOOD_EVAL_DATASET)} examples to dataset")
    return dataset.id


def run_evaluation(
    dataset_name: str = "food-agent-eval",
    experiment_prefix: str = "food-agent"
) -> dict:
    """
    Run evaluation on the food agent.

    Args:
        dataset_name: Name of the LangSmith dataset to use
        experiment_prefix: Prefix for the experiment name

    Returns:
        Evaluation results summary
    """
    logger.info(f"Starting evaluation with dataset: {dataset_name}")

    # Run evaluation with custom evaluators
    results = evaluate(
        sync_run_food_agent,
        data=dataset_name,
        evaluators=[
            relevance_evaluator,
            helpfulness_evaluator,
            tone_evaluator,
        ],
        experiment_prefix=experiment_prefix,
    )

    logger.info("Evaluation complete!")
    return results


def run_evaluation_with_llm_judge(
    dataset_name: str = "food-agent-eval",
    experiment_prefix: str = "food-agent-llm-judge"
) -> dict:
    """
    Run evaluation using LLM as a judge.

    Args:
        dataset_name: Name of the LangSmith dataset to use
        experiment_prefix: Prefix for the experiment name

    Returns:
        Evaluation results summary
    """
    logger.info(f"Starting LLM-judge evaluation with dataset: {dataset_name}")

    # Create LLM-based evaluators
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    # Criteria-based evaluator
    criteria_evaluator = LangChainStringEvaluator(
        "criteria",
        config={
            "criteria": {
                "food_relevance": "Does the response provide relevant food or restaurant recommendations?",
                "helpfulness": "Is the response helpful and actionable for someone looking for food?",
                "enthusiasm": "Does the response convey enthusiasm and a friendly foodie tone?",
            },
            "llm": llm,
        }
    )

    results = evaluate(
        sync_run_food_agent,
        data=dataset_name,
        evaluators=[criteria_evaluator],
        experiment_prefix=experiment_prefix,
    )

    logger.info("LLM-judge evaluation complete!")
    return results


# ============================================================================
# CLI Interface
# ============================================================================

if __name__ == "__main__":
    import argparse
    import asyncio

    parser = argparse.ArgumentParser(description="Run Food Agent Evaluations")
    parser.add_argument(
        "--create-dataset",
        action="store_true",
        help="Create the evaluation dataset in LangSmith"
    )
    parser.add_argument(
        "--run-eval",
        action="store_true",
        help="Run evaluation with custom evaluators"
    )
    parser.add_argument(
        "--run-llm-eval",
        action="store_true",
        help="Run evaluation with LLM judge"
    )
    parser.add_argument(
        "--dataset-name",
        default="food-agent-eval",
        help="Name of the dataset to use"
    )
    parser.add_argument(
        "--experiment-prefix",
        default="food-agent",
        help="Prefix for experiment names"
    )

    args = parser.parse_args()

    if args.create_dataset:
        create_eval_dataset(args.dataset_name)
        print(f"Dataset '{args.dataset_name}' created/updated successfully!")

    if args.run_eval:
        results = run_evaluation(args.dataset_name, args.experiment_prefix)
        print("Evaluation results:", results)

    if args.run_llm_eval:
        results = run_evaluation_with_llm_judge(args.dataset_name, f"{args.experiment_prefix}-llm")
        print("LLM Judge evaluation results:", results)

    if not any([args.create_dataset, args.run_eval, args.run_llm_eval]):
        parser.print_help()
