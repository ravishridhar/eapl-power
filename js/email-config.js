// Public endpoint URLs only. SMTP credentials belong outside the web root.
window.EAPL_EMAIL_CONFIG = Object.freeze({
  captchaUrl: new URL('../api/captcha.php', document.currentScript.src).href,
  submitUrl: new URL('../api/enquiry.php', document.currentScript.src).href,
});
