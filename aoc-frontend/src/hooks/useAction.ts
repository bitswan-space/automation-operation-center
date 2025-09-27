import { useState } from 'react';

// Placeholder for useAction hook
export const useAction = (action: any, options: any = {}) => {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState(null);

  const execute = async (input: any) => {
    setIsPending(true);
    try {
      const actionResult = await action(input);
      setResult(actionResult);
      if (options.onSuccess) {
        options.onSuccess(actionResult);
      }
      return actionResult;
    } catch (error) {
      if (options.onError) {
        options.onError({ error });
      }
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending, result };
};