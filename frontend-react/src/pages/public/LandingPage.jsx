import { Link } from "react-router-dom";

function LandingPage() {
    return <div>
        <h1>
            Welcome to EventPro
        </h1>

        <Link to="/signin">
            <button>Sign In</button>
        </Link>

        <Link to="/client/dashboard">
            <button>Client</button>
        </Link>
        <Link to="/vendor/dashboard">
        <button>Vendor</button>
      </Link>

      <Link to="/staff/dashboard">
        <button>Staff</button>
      </Link>

      <Link to="/admin/dashboard">
        <button>Admin</button>
      </Link>

      <Link to="/superuser/dashboard">
        <button>Superuser</button>
      </Link>
    </div>
}

export default LandingPage