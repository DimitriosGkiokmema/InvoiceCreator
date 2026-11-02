import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from './webpages/home';
import { InvoiceViewPage } from "./webpages/invoiceView";
import { InvoiceCreate } from "./webpages/invoiceCreate";

function App() {
  return (
    <BrowserRouter>
        {/* <nav>
          <ul style={{ display: "flex", gap: "20px" }}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/user/123">User Details</Link>
            </li>
            <li>
              <Link to="/profile">User Profile</Link>
            </li>
          </ul>
        </nav> */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/invoice/:invoiceID" element={<InvoiceViewPage />} />
          <Route path="/create" element={<InvoiceCreate />} />
          {/* <Route path="/about" element={<About />} />
          <Route path="/user/:userId" element={<UserDetail />} />
          <Route path="/profile" element={<UserProfile />} /> */}
        </Routes>
      </BrowserRouter>
  );
}

export default App;
