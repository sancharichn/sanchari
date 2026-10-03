/** Shared between the launch intro (client) and the root layout (server). */

export const INTRO_SEEN_KEY = "sanchari:intro-seen";
export const INTRO_DONE_EVENT = "sanchari:intro-done";

/**
 * Runs before the page paints (inlined in <head>). It turns the intro on only
 * for the first home-page visit of a browser session, and never for people
 * who prefer reduced motion or have asked to save data. Without JavaScript
 * the attribute is never set, so the intro stays hidden.
 */
export const INTRO_GATE_SCRIPT = `(function(){try{
var d=document.documentElement;
if(location.pathname!=="/")return;
if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
if(navigator.connection&&navigator.connection.saveData)return;
if(sessionStorage.getItem("${INTRO_SEEN_KEY}"))return;
d.setAttribute("data-intro","on");
}catch(e){}})();`;
