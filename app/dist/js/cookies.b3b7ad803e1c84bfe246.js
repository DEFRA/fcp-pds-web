/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var cookies;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./app/frontend/js/cookies.js"
/*!************************************!*\
  !*** ./app/frontend/js/cookies.js ***!
  \************************************/
() {

eval("{const acceptButton = document.querySelector('.js-cookies-button-accept')\nconst rejectButton = document.querySelector('.js-cookies-button-reject')\nconst acceptedBanner = document.querySelector('.js-cookies-accepted')\nconst rejectedBanner = document.querySelector('.js-cookies-rejected')\nconst questionBanner = document.querySelector('.js-question-banner')\nconst cookieBanner = document.querySelector('.js-cookies-banner')\nconst cookieContainer = document.querySelector('.js-cookies-container')\n\ncookieContainer.style.display = 'block'\n\nconst showBanner = (banner) => {\n  questionBanner.setAttribute('hidden', 'hidden')\n  banner.removeAttribute('hidden')\n  // Shift focus to the banner\n  banner.setAttribute('tabindex', '-1')\n  banner.focus()\n\n  banner.addEventListener('blur', function () {\n    banner.removeAttribute('tabindex')\n  })\n}\n\nacceptButton.addEventListener('click', function (event) {\n  showBanner(acceptedBanner)\n  event.preventDefault()\n  submitPreference(true)\n})\n\nrejectButton.addEventListener('click', function (event) {\n  showBanner(rejectedBanner)\n  event.preventDefault()\n  submitPreference(false)\n})\n\nacceptedBanner.querySelector('.js-hide').addEventListener('click', function () {\n  cookieBanner.setAttribute('hidden', 'hidden')\n})\n\nrejectedBanner.querySelector('.js-hide').addEventListener('click', function () {\n  cookieBanner.setAttribute('hidden', 'hidden')\n})\n\nconst submitPreference = (accepted) => {\n  const xhr = new XMLHttpRequest()\n  xhr.open('POST', '/cookies', true)\n  xhr.setRequestHeader('Content-Type', 'application/json')\n  xhr.send(JSON.stringify({\n    analytics: accepted,\n    async: true\n  }))\n}\n\n\n//# sourceURL=webpack://fcp-pds-web/./app/frontend/js/cookies.js?\n}");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./app/frontend/js/cookies.js"]();
/******/ 	cookies = __webpack_exports__;
/******/ 	
/******/ })()
;