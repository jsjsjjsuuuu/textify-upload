// Function to find a field by its name
export const findField = (window: Window & typeof globalThis, fieldName: string): HTMLElement | null => {
  try {
    const elements = window.document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      if (element && (element.name === fieldName || element.id === fieldName)) {
        return element;
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding field:", fieldName, error);
    return null;
  }
};

// Function to find a field within iframes
export const findFieldInIframes = (window: Window & typeof globalThis, fieldName: string): HTMLElement | null => {
  try {
    const iframes = window.document.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i] as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        const field = findField(iframe.contentWindow as Window & typeof globalThis, fieldName);
        if (field) {
          return field;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding field in iframes:", fieldName, error);
    return null;
  }
};

// Function to fill a field with a value
export const fillField = (element: HTMLElement | null, value: string): boolean => {
  if (!element) {
    console.warn("Element not found, cannot fill value.");
    return false;
  }

  try {
    if (element instanceof HTMLInputElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Filled input field with value: ${value}`);
      return true;
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Filled textarea field with value: ${value}`);
      return true;
    } else {
      console.warn("Unsupported element type, cannot fill value.");
      return false;
    }
  } catch (error) {
    console.error("Error filling field:", error);
    return false;
  }
};
