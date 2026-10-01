import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Passenger from "./pages/Passenger";
import Driver from "./pages/Driver";
import Home from "./pages/Home";
import RoutesPage from "./pages/Routes";
import RouteDetail from "./pages/RouteDetail";
import TripDetail from "./pages/TripDetail";
import Saved from "./pages/Saved";
import Offline from "./pages/Offline";
import Admin from "./pages/Admin";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/passenger" element={<Home />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/route-detail/:busId" element={<RouteDetail />} />
        <Route path="/trip/:tripId" element={<TripDetail />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/offline" element={<Offline />} />
        <Route path="/track/:busId" element={<Passenger />} />
        <Route path="/driver" element={<Driver />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
