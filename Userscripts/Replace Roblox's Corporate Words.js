// ==UserScript==
// @name         Replace Roblox's Corporate Words
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Self Explanatory
// @author       Razor7100
// @match        https://www.roblox.com/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    const globalReplacements = {
        connection: 'friend',
        connections: 'friends',
        charts: 'discover',
        marketplace: 'catalog',
        communities: 'groups',
        community: 'group',
        experiences: 'games',
        experience: 'game'
    };

    const communityPageReplacements = {
        followers: 'members'
    };

    const isCommunityPage = location.href.startsWith('https://www.roblox.com/communities/');

    const replacements = isCommunityPage
        ? { ...globalReplacements, ...communityPageReplacements }
        : globalReplacements;

    function preserveCase(original, replacement) {
        if (original === original.toUpperCase()) {
            return replacement.toUpperCase();
        } else if (original[0] === original[0].toUpperCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1);
        } else {
            return replacement;
        }
    }

    function processTextNode(textNode) {
        textNode.textContent = textNode.textContent.replace(/\b\w+\b/g, match => {
            const lower = match.toLowerCase();
            if (replacements.hasOwnProperty(lower)) {
                return preserveCase(match, replacements[lower]);
            }
            return match;
        });
    }

    function processAttributeText(value) {
        return value.replace(/\b\w+\b/g, match => {
            const lower = match.toLowerCase();
            if (replacements.hasOwnProperty(lower)) {
                return preserveCase(match, replacements[lower]);
            }
            return match;
        });
    }

    function replaceAttributes(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const attributesToCheck = ['alt', 'placeholder'];
        for (const attr of attributesToCheck) {
            if (node.hasAttribute(attr)) {
                const original = node.getAttribute(attr);
                const updated = processAttributeText(original);
                if (original !== updated) {
                    node.setAttribute(attr, updated);
                }
            }
        }
    }

    function replaceTextContent(node) {
        const treeWalker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (!node.parentNode || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode.nodeName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        while (treeWalker.nextNode()) {
            processTextNode(treeWalker.currentNode);
        }

        const allElements = node.querySelectorAll('*');
        for (const el of allElements) {
            replaceAttributes(el);
        }
    }

    let scheduled = false;
    let nodesToProcess = new Set();

    function scheduleProcessing() {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
            nodesToProcess.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    processTextNode(node);
                    if (node.parentNode) replaceAttributes(node.parentNode);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    replaceTextContent(node);
                }
            });
            nodesToProcess.clear();
            scheduled = false;
        }, 50);
    }

    function observeMutations() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => nodesToProcess.add(node));
                } else if (mutation.type === 'characterData') {
                    nodesToProcess.add(mutation.target);
                } else if (mutation.type === 'attributes') {
                    nodesToProcess.add(mutation.target);
                }
            }
            scheduleProcessing();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['alt', 'placeholder']
        });
    }

    replaceTextContent(document.body);
    observeMutations();
})();
