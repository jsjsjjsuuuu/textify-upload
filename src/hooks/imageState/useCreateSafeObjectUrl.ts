
export const useCreateSafeObjectUrl = () => {
  const createSafeObjectURL = async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(file);
        resolve(url);
      } catch (error) {
        console.error("Error creating object URL:", error);
        reject(error);
      }
    });
  };

  const revokeObjectURL = (url: string): void => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  return {
    createSafeObjectURL,
    revokeObjectURL
  };
};
