export const getMQTTConfig = async () => {
  const response = await fetch("/api/mqtt/config");
  return response.json();
};
