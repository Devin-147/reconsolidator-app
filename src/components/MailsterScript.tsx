
import { useEffect } from "react";

const MailsterScript = () => {
  useEffect(() => {
    // Only add the script if it doesn't already exist
    if (!document.getElementById("mailster-script")) {
      const script = document.createElement("script");
      script.id = "mailster-script";
      
      // Replace this URL with your actual Mailster installation URL
      script.src = "https://reprogrammingmind.com/wp-content/plugins/mailster/assets/js/form.min.js";
      script.async = true;
      
      script.onload = () => {
        console.log("Mailster script loaded successfully");
      };
      
      script.onerror = () => {
        console.error("Failed to load Mailster script");
      };
      
      document.body.appendChild(script);
    }
    
    return () => {
      // Optional cleanup if needed when component unmounts
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default MailsterScript;
