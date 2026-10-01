import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Passenger from "./pages/Passenger";
import Driver from "./pages/Driver";
import Home from "./pages/Home";
import RoutesPage from "./pages/Routes";
import RouteDetail from "./pages/RouteDetail";
import JourneyPlanner from "./pages/JourneyPlanner";
import FareCalculator from "./pages/FareCalculator";
import TripDetail from "./pages/TripDetail";
import Saved from "./pages/Saved";
import StopDetail from "./pages/StopDetail";
import BusDetail from "./pages/BusDetail";
import Offline from "./pages/Offline";
import Admin from "./pages/Admin";
import PassengerLayout from "./components/PassengerLayout";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Passenger Routes with Shared Navigation */}
        <Route element={<PassengerLayout />}>
          <Route path="/passenger" element={<Home />} />
          <Route path="/journey-planner" element={<JourneyPlanner />} />
          <Route path="/fare-calculator" element={<FareCalculator />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/route-detail/:busId" element={<RouteDetail />} />
          <Route path="/trip/:tripId" element={<TripDetail />} />
          <Route path="/stop/:stopId" element={<StopDetail />} />
          <Route path="/bus/:busId" element={<BusDetail />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/offline" element={<Offline />} />
          <Route path="/track/:busId" element={<Passenger />} />
        </Route>

        {/* Independent Routes */}
        <Route path="/driver" element={<Driver />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
