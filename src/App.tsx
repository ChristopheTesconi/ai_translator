import "./App.css";
// import Navbar from "./components/Navbar";
// import ContactForm from "./components/ListingForm";

// function App() {
//   return (
//     <>
//       <Navbar />
//       <ContactForm />
//     </>
//   );
// }
// export default App;

import "./App.css";
import Navbar from "./components/Navbar";
import RestaurantsList from "./components/RestaurantsList.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminListings from "./pages/AdminListing";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<RestaurantsList />} />
        <Route path="/admin/listings" element={<AdminListings />} />
      </Routes>
    </Router>
  );
}

export default App;
