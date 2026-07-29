import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { http } from "../../Modules/http";

const ProtectedAdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await http().get("/api/auth/session");

        if (data.authenticated && data.user.role === "admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (error) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authorized) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminLayout;