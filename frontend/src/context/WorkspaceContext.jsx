import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const WorkspaceContext = createContext(null);
const STORAGE_KEY = "ruaa.current_workspace_id";

export const WorkspaceProvider = ({ children }) => {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!user) {
            setWorkspaces([]);
            setCurrent(null);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("/business/workspaces/my");
            setWorkspaces(res.data);
            const stored = localStorage.getItem(STORAGE_KEY);
            const found = stored && res.data.find((w) => w.id === stored);
            setCurrent(found || res.data[0] || null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const selectWorkspace = (ws) => {
        setCurrent(ws);
        if (ws) localStorage.setItem(STORAGE_KEY, ws.id);
    };

    // Helper: business API call with X-Workspace-Id header injected
    const bapi = {
        get: (url, config = {}) =>
            api.get(url, { ...config, headers: { ...config.headers, "X-Workspace-Id": current?.id } }),
        post: (url, data, config = {}) =>
            api.post(url, data, { ...config, headers: { ...config.headers, "X-Workspace-Id": current?.id } }),
        put: (url, data, config = {}) =>
            api.put(url, data, { ...config, headers: { ...config.headers, "X-Workspace-Id": current?.id } }),
        delete: (url, config = {}) =>
            api.delete(url, { ...config, headers: { ...config.headers, "X-Workspace-Id": current?.id } }),
    };

    return (
        <WorkspaceContext.Provider
            value={{ workspaces, current, loading, refresh, selectWorkspace, bapi }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => useContext(WorkspaceContext);
