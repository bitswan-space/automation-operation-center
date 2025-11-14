import {
    getActiveOrgFromCookies,
    Organisation,
} from "@/data/organisations";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useOrgsQuery } from "@/hooks/useOrgsQuery";

interface OrgsContextType {
    orgs: Organisation[];
    activeOrg: Organisation | undefined;
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
    const [activeOrg, setActiveOrg] = useState<Organisation | undefined>(undefined);
    const { isAuthenticated } = useAuth();
    const { data, isLoading, error } = useOrgsQuery();

    // Flatten all pages from the infinite query into a single array
    const orgs = useMemo(() => {
        if (!data?.pages) {
            return [];
        }
        return data.pages.flatMap((page) => {
            // Handle both success and error responses
            if (page.status === "success") {
                return page.results ?? [];
            }
            return [];
        });
    }, [data]);

    // Load active org from cookies and set it
    useEffect(() => {
        if (!isAuthenticated || isLoading) {
            return;
        }

        const loadActiveOrg = async () => {
            try {
                const activeOrgData = await getActiveOrgFromCookies();
                // If we have an active org from cookies, use it; otherwise use the first org
                setActiveOrg(activeOrgData ?? orgs[0]);
            } catch (error) {
                console.error("Error loading active org:", error);
                // Fallback to first org if cookie lookup fails
                setActiveOrg(orgs[0]);
            }
        };

        if (orgs.length > 0) {
            loadActiveOrg();
        } else if (!isLoading && !error) {
            // If query is done but no orgs, set activeOrg to undefined
            setActiveOrg(undefined);
        }
    }, [isAuthenticated, isLoading, orgs, error]);

    return (
        <OrgsContext.Provider value={{ orgs, activeOrg }}>
            {children}
        </OrgsContext.Provider>
    );
};
