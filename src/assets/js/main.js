import "/assets/css/main.scss";
import Splide from "@splidejs/splide";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ScrollAnimation } from "./components/common/scrollAnimation";

// Initialize GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Initialize components
ScrollAnimation();

// Export for global access if needed
export { gsap, ScrollTrigger, Splide };
