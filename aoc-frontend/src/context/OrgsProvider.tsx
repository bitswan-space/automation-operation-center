import {
    fetchOrgs,
    getActiveOrgFromCookies,
    Organisation,
} from "@/data/organisations";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuth } from "./AuthContext";

interface OrgsContextType {
    orgs: Organisation[];
    activeOrg: Organisation;
}

const OrgsContext = createContext<OrgsContextType | undefined>(undefined);

export const useOrgs = () => {
    const context = useContext(OrgsContext);
    if (context === undefined) {
        throw new Error("useOrgs must be used within an OrgsProvider");
    }
    return context;
};

export const OrgsProvider = ({ children }: { children: ReactNode }) => {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [activeOrg, setActiveOrg] = useState<any>();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const loadData = async () => {
            try {
                const [orgsData, activeOrgData] = await Promise.all([
                    fetchOrgs(),
                    getActiveOrgFromCookies(),
                ]);

                setOrgs(orgsData?.results ?? []);
                setActiveOrg(activeOrgData);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            }
        };

        loadData();
    }, [isAuthenticated]);

    return (
        <OrgsContext.Provider value={{ orgs, activeOrg }}>
            {children}
        </OrgsContext.Provider>
    );
};
