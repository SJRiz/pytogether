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
            // Redirect to the IDE with the necessary state
            // PyIDE will read 'shareToken' from state and attach it to the WebSocket connection
            navigate('/ide', {
                state: {
                    groupId: res.data.group_id,
                    projectId: res.data.project_id,
                    projectName: res.data.project_name,
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