import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import {http} from "../../Modules/http"

const ProtectedLayout = () => {

  const httpReq=http();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await httpReq.get("/api/auth/session");

        if (data.authenticated) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;