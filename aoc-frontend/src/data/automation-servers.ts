"use server";

import { getAutomationServers } from "@/data/automation-server";
import { type AutomationServer } from "@/data/automation-server";

export async function getAutomationServersAction(): Promise<AutomationServer[]> {
  try {
    const response = await getAutomationServers();
    return response.results;
  } catch (error) {
    console.error('Failed to fetch automation servers:', error);
    return [];
  }
} 