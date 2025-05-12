"use server";

import { MQTTProfile } from "./mqtt-profiles";
import { authenticatedBitswanBackendInstance } from "../bitswan-backend";

type GetMQTTTokenResponse = {
    token: string;
}

export async function getMQTTToken(activeMQTTProfile: MQTTProfile | null): Promise<string | null> {
    const bitswanBEInstance = await authenticatedBitswanBackendInstance();

    const res = await bitswanBEInstance.get<GetMQTTTokenResponse>(`/profiles/${activeMQTTProfile?.group_id}/emqx/jwt`);

    return res.data?.token ?? null;
}
