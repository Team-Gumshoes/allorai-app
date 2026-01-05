import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FlightsPage from './features/flights/FlightsPage';
import HotelsPage from './features/hotels/HotelsPage';
import TransportPage from './features/transport/TransportPage';
import TripPlannerPage from './features/trip-planner/TripPlannerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/trip-planner" replace />} />
          <Route path="trip-planner" element={<TripPlannerPage />} />
          <Route path="flights" element={<FlightsPage />} />
          <Route path="hotels" element={<HotelsPage />} />
          <Route path="transport" element={<TransportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
