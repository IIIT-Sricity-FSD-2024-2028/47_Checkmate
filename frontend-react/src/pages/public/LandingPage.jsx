import { Link } from "react-router-dom";

function LandingPage() {
  return <div>
    <h1>
      Welcome to EventPro
    </h1>

    <Link to="/client">
      <button>Client</button>
    </Link>
    <Link to="/vendor/dashboard">
      <button>Vendor</button>
    </Link>

    <Link to="/staff">
      <button>Staff</button>
    </Link>

    <Link to="/admin">
      <button>Admin</button>
    </Link>

    <Link to="/superuser">
      <button>Superuser</button>
    </Link>
  </div>
}

export default LandingPage