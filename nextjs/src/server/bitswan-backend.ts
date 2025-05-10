import axios from "axios";
import { BITSWAN_BACKEND_API_URL } from "./actions/shared";
import { auth } from "./auth";

// Will move to a separate file
export const authenticatedBitswanBackendInstance = async () => {  
    const session = await auth();
    const apiToken = session?.access_token;
  
    return axios.create({
      baseURL: BITSWAN_BACKEND_API_URL,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
  };