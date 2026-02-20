import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../axiosConfig";

export default function SharedProjectHandler() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const validateAndJoin = async () => {
      try {
        const res = await api.post('/api/validate-share-link/', { token });
        
        if (res.data.valid) {
            const { group_id, project_id, project_name } = res.data;
            
            navigate(`/groups/${group_id}/projects/${project_id}?shareToken=${token}`, {
                state: { 
                    projectName: project_name,
                    shareToken: token 
                },
                replace: true
            });
        }
      } catch (err) {
        console.error("Invalid link", err);
        alert("This invitation link is invalid or has expired.");
        navigate('/home');
      }
    };

    if (token) {
        validateAndJoin();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse">Joining session...</p>
        </div>
    </div>
  );
}