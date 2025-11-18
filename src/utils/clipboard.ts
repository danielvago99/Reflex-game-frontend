/**
 * Copy text to clipboard with fallback for environments where Clipboard API is blocked
 * @param text - The text to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first (only if available and in secure context)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Silently fall through to fallback method
      // The API might be blocked by permissions policy
    }
  }
  
  // Fallback method using execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible but still accessible
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    // Copy the text
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Both clipboard methods failed:', err);
    return false;
  }
}