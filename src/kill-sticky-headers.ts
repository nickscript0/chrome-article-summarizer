
// Updated the original to include the new 'sticky' style in addition to 'fixed' https://alisdair.mcdiarmid.org/kill-sticky-headers/
export function killStickyHeaders() {
    const elements = document.querySelectorAll('body *');
    for (let i = 0; i < elements.length; i++) {
        const computedStyle = getComputedStyle(elements[i]).position;
        if (computedStyle && ["sticky", "fixed"].includes(computedStyle)) {
            const parentNode = elements[i].parentNode;
            parentNode && parentNode.removeChild(elements[i]);
        }
    }
}
