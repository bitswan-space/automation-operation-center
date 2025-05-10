"use server";

import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { MQTTProfile } from "./mqtt-profiles";
import { ACTIVE_MQTT_PROFILE_STORAGE_KEY } from "@/shared/constants";
import { authenticatedBitswanBackendInstance } from "../bitswan-backend";
import { auth, signOut } from "../auth";



export async function getMQTTToken(activeMQTTProfile: MQTTProfile | null): Promise<string | null> {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();

    const res = await bitswanBEInstance.get(`/profiles/${activeMQTTProfile?.group_id}/emqx/jwt`);

    return res.data.token;
}
