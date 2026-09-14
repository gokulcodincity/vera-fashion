import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, Banknote, Check, ChevronLeft, ChevronRight, CircleCheckBig, Clock, CreditCard, Funnel, Gem, Heart, Leaf, Lock, Mail, MapPin, Menu, Minus, Navigation, Phone, Plus, RotateCcw, Ruler, Scissors, Search, Send, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Star, Trash, Truck, X } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
//#region src/config/store.js
/**
* ------------------------------------------------------------------
* STORE CONFIGURATION
* ------------------------------------------------------------------
* Everything a shop owner would want to change lives in this file.
* Swap these values for a real client and the whole site updates:
* brand name, contact details, WhatsApp number, address, socials,
* shipping rules and homepage announcement.
*
* NOTE: "V\u00C9RA" is written with a unicode escape so the accented
* character renders identically no matter how the file is encoded.
*/
var store = {
	storeName: "VÉRA",
	storeNamePlain: "VERA",
	tagline: "Style That Speaks.",
	shortDescription: "Curated fashion for every version of you.",
	established: "2016",
	phone: "+91 98765 43210",
	phoneDial: "+919876543210",
	whatsapp: "919876543210",
	whatsappMessage: "Hi VÉRA, I would like to know more about your collection.",
	email: "hello@verafashion.in",
	supportEmail: "care@verafashion.in",
	address: {
		line1: "24 Anna Salai, Ground Floor",
		line2: "Thousand Lights",
		city: "Chennai",
		state: "Tamil Nadu",
		pincode: "600002",
		country: "India"
	},
	mapsUrl: "https://maps.google.com/?q=Anna+Salai+Chennai",
	openingHours: [
		{
			days: "Monday - Friday",
			hours: "10:30 AM - 9:00 PM"
		},
		{
			days: "Saturday",
			hours: "10:00 AM - 9:30 PM"
		},
		{
			days: "Sunday",
			hours: "11:00 AM - 8:00 PM"
		}
	],
	instagram: "https://instagram.com/verafashion",
	instagramHandle: "@verafashion",
	facebook: "https://facebook.com/verafashion",
	pinterest: "https://pinterest.com/verafashion",
	currency: "INR",
	locale: "en-IN",
	freeShippingThreshold: 1999,
	deliveryFee: 99,
	codFee: 49,
	returnWindowDays: 15,
	announcements: [
		"Free shipping on orders above Rs.1,999",
		"Festive edit is live - up to 40% off",
		"Easy 15 day returns on all orders"
	],
	newsletterOffer: "Get first access to new collections, exclusive offers and fashion inspiration."
};
/** Full address as a single readable line. */
var formattedAddress = [
	store.address.line1,
	store.address.line2,
	`${store.address.city} ${store.address.pincode}`,
	store.address.state
].join(", ");
/** Deep link that opens WhatsApp with a pre-filled message. */
var whatsappLink = (message = store.whatsappMessage) => `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;
/** Deep link for the phone dialler. */
var telLink = `tel:${store.phoneDial}`;
/** Deep link for the mail client. */
var mailtoLink = `mailto:${store.email}`;
//#endregion
//#region src/hooks/useLocalStorage.js
/**
* State that survives a page reload.
*
* Reads are lazy and defensive: a corrupted or unavailable storage entry
* falls back to the initial value instead of crashing the app (private
* browsing modes can throw on access).
*/
function useLocalStorage(key, initialValue) {
	const [value, setValue] = useState(() => read(key, initialValue));
	const keyRef = useRef(key);
	useEffect(() => {
		keyRef.current = key;
	}, [key]);
	useEffect(() => {
		try {
			window.localStorage.setItem(key, JSON.stringify(value));
		} catch {}
	}, [key, value]);
	/** Keep multiple tabs in sync. */
	useEffect(() => {
		const onStorage = (event) => {
			if (event.key !== keyRef.current || event.newValue == null) return;
			try {
				setValue(JSON.parse(event.newValue));
			} catch {}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);
	return [
		value,
		setValue,
		useCallback(() => setValue(initialValue), [initialValue])
	];
}
function read(key, fallback) {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = window.localStorage.getItem(key);
		if (raw == null) return fallback;
		return JSON.parse(raw) ?? fallback;
	} catch {
		return fallback;
	}
}
//#endregion
//#region src/lib/images.js
/**
* Image helpers.
*
* All photography is served from the Unsplash image CDN using stable photo
* ids, sized and cropped on the fly. Every id in `PHOTOS` has been verified
* to resolve, so the demo never shows a broken image. Replace the ids (or
* point `buildImageUrl` at your own CDN) when working with a real client.
*/
var CDN = "https://images.unsplash.com/";
/**
* Build a responsive, cropped image URL.
*
* @param {string} id     Unsplash photo id, e.g. "photo-1539109136881-3be0616acf4b"
* @param {object} [opts]
* @param {number} [opts.w] target width in px
* @param {number} [opts.h] target height in px
* @param {string} [opts.crop] imgix crop strategy
* @param {number} [opts.q] jpeg quality
*/
function buildImageUrl(id, { w = 900, h, crop = "faces,entropy", q = 78 } = {}) {
	if (!id) return "";
	const params = new URLSearchParams({
		auto: "format,compress",
		fit: "crop",
		crop,
		q: String(q),
		w: String(w)
	});
	if (h) params.set("h", String(h));
	return `${CDN}${id}?${params.toString()}`;
}
/**
* Product gallery. A single garment photograph is framed three different
* ways (full look, detail, alternate framing) which is exactly how premium
* fashion stores present a product. When a genuine second photograph of the
* same garment family exists it is passed as `secondary`.
*/
function galleryFor(primary, secondary) {
	const frames = [buildImageUrl(primary, {
		w: 1100,
		h: 1400,
		crop: "faces,entropy"
	}), buildImageUrl(primary, {
		w: 1100,
		h: 1400,
		crop: "entropy"
	})];
	if (secondary) {
		frames.splice(1, 0, buildImageUrl(secondary, {
			w: 1100,
			h: 1400,
			crop: "entropy"
		}));
		frames.push(buildImageUrl(secondary, {
			w: 1100,
			h: 1400,
			crop: "top"
		}));
	} else frames.push(buildImageUrl(primary, {
		w: 1100,
		h: 1400,
		crop: "top"
	}));
	return frames;
}
/** Editorial photography used across the marketing sections. */
var PHOTOS = {
	heroPortrait: "photo-1539109136881-3be0616acf4b",
	heroInset: "photo-1485462537746-965f33f7f6a7",
	promoWide: "photo-1483985988355-763728e1935b",
	featuredWide: "photo-1512436991641-6745cdb1723f",
	categoryWomen: "photo-1485462537746-965f33f7f6a7",
	categoryMen: "photo-1621072156002-e2fccdc0b176",
	categoryNew: "photo-1578932750294-f5075e85f44a",
	categoryAccessories: "photo-1492707892479-7bc8d5a4ee93",
	storefront: "photo-1445205170230-053b83016050",
	atelier: "photo-1441984904996-e0b6ba687e04",
	studio: "photo-1441986300917-64674bd600d8",
	rail: "photo-1490481651871-ab68de25d43d",
	social: [
		"photo-1469334031218-e382a71b716b",
		"photo-1509319117193-57bab727e09d",
		"photo-1567401893414-76b7b1e5a7a5",
		"photo-1495121605193-b116b5b9c5fe",
		"photo-1489987707025-afc232f7ea0f",
		"photo-1600950207944-0d63e8edbc3f"
	]
};
//#endregion
//#region src/data/products.js
/**
* ------------------------------------------------------------------
* PRODUCT CATALOGUE
* ------------------------------------------------------------------
* Static demo catalogue. Swap the entries below with a real client's
* range - the shop, filters, search and product pages are all driven
* from this single array.
*
* `photo` / `altPhoto` are Unsplash photo ids; the gallery URLs are
* generated by `galleryFor()` so image sizing stays consistent.
*/
var LETTER_SIZES = [
	"XS",
	"S",
	"M",
	"L",
	"XL",
	"XXL"
];
var WAIST_SIZES = [
	"28",
	"30",
	"32",
	"34",
	"36"
];
var SHOE_SIZES = [
	"UK 6",
	"UK 7",
	"UK 8",
	"UK 9",
	"UK 10"
];
var ONE_SIZE = ["One Size"];
var C = {
	ivory: {
		name: "Ivory",
		hex: "#F4EFE7"
	},
	cream: {
		name: "Cream",
		hex: "#EDE4D5"
	},
	black: {
		name: "Black",
		hex: "#1B1815"
	},
	charcoal: {
		name: "Charcoal",
		hex: "#3A3733"
	},
	navy: {
		name: "Navy",
		hex: "#1F2A44"
	},
	indigo: {
		name: "Indigo",
		hex: "#2E3E5C"
	},
	clay: {
		name: "Clay",
		hex: "#A05B43"
	},
	rust: {
		name: "Rust",
		hex: "#9C4A2A"
	},
	burgundy: {
		name: "Burgundy",
		hex: "#6E1F2B"
	},
	wine: {
		name: "Wine",
		hex: "#7B2D3B"
	},
	blush: {
		name: "Blush",
		hex: "#E4C9C2"
	},
	rose: {
		name: "Rose",
		hex: "#D08C93"
	},
	olive: {
		name: "Olive",
		hex: "#5A5B3C"
	},
	sage: {
		name: "Sage",
		hex: "#A9B29B"
	},
	mint: {
		name: "Mint",
		hex: "#BFD8CD"
	},
	tan: {
		name: "Tan",
		hex: "#B98A5E"
	},
	camel: {
		name: "Camel",
		hex: "#C09A6B"
	},
	stone: {
		name: "Stone",
		hex: "#C8C0B4"
	},
	sand: {
		name: "Sand",
		hex: "#DCCDB4"
	},
	mustard: {
		name: "Mustard",
		hex: "#D0A02B"
	},
	sky: {
		name: "Powder Blue",
		hex: "#A9C3DA"
	},
	lightDenim: {
		name: "Light Wash",
		hex: "#9BB4CC"
	},
	midDenim: {
		name: "Mid Wash",
		hex: "#5C7EA1"
	},
	darkDenim: {
		name: "Dark Wash",
		hex: "#2F4257"
	},
	teal: {
		name: "Teal",
		hex: "#1F6F72"
	},
	grey: {
		name: "Heather Grey",
		hex: "#B8B4AE"
	}
};
var RAW = [
	{
		id: "amaira-floral-wrap-dress",
		name: "Amaira Floral Wrap Dress",
		category: "Dresses",
		gender: "Women",
		price: 2499,
		originalPrice: 3499,
		rating: 4.7,
		reviewCount: 128,
		sizes: [
			"XS",
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [
			C.ivory,
			C.blush,
			C.navy
		],
		photo: "photo-1496747611176-843222e1e57c",
		altPhoto: "photo-1567401893414-76b7b1e5a7a5",
		isNew: true,
		isBestSeller: false,
		description: "A soft-flowing wrap dress in a hand-drawn floral print, cut with a flattering surplice neckline and a tie waist that shapes the silhouette. Finished with a fluid midi hem that moves beautifully.",
		highlights: [
			"Adjustable wrap tie waist",
			"Flutter sleeve detail",
			"Lined bodice"
		],
		details: {
			fabric: "100% viscose crepe, lightweight and breathable",
			fit: "Regular fit, true to size. Model is 5'8\" wearing size S",
			care: "Gentle machine wash cold, line dry in shade, warm iron",
			origin: "Ethically made in Tiruppur, Tamil Nadu"
		}
	},
	{
		id: "rhea-polka-midi-dress",
		name: "Rhea Polka Midi Dress",
		category: "Dresses",
		gender: "Women",
		price: 1899,
		originalPrice: 2599,
		rating: 4.6,
		reviewCount: 94,
		sizes: [
			"XS",
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [
			C.wine,
			C.black,
			C.ivory
		],
		photo: "photo-1502716119720-b23a93e5fe1b",
		isNew: false,
		isBestSeller: false,
		description: "A weekend favourite. Classic polka dots on a fluid base, styled with a ruffled asymmetric hem and elasticated waist for easy movement from brunch to evening.",
		highlights: [
			"Asymmetric ruffle hem",
			"Elasticated waist",
			"Side pockets"
		],
		details: {
			fabric: "Rayon blend with a soft drape",
			fit: "Relaxed fit through the body",
			care: "Machine wash cold with like colours, do not bleach",
			origin: "Made in India"
		}
	},
	{
		id: "elara-off-shoulder-gown",
		name: "Elara Off-Shoulder Gown",
		category: "Dresses",
		gender: "Women",
		price: 4999,
		originalPrice: 6499,
		rating: 4.8,
		reviewCount: 76,
		sizes: [
			"XS",
			"S",
			"M",
			"L"
		],
		colors: [
			C.wine,
			C.navy,
			C.black
		],
		photo: "photo-1566174053879-31528523f8ae",
		isNew: false,
		isBestSeller: true,
		description: "An occasion gown with quiet drama. Structured off-shoulder neckline, a sculpted bodice and a long column skirt in a lustrous satin-finish fabric.",
		highlights: [
			"Boned bodice for structure",
			"Concealed back zip",
			"Floor-sweeping length"
		],
		details: {
			fabric: "Poly-satin with matte lining",
			fit: "Slim fit, consider one size up for a relaxed drape",
			care: "Dry clean only",
			origin: "Made in India"
		}
	},
	{
		id: "noor-tulle-evening-gown",
		name: "Noor Tulle Evening Gown",
		category: "Dresses",
		gender: "Women",
		price: 5799,
		originalPrice: 7999,
		rating: 4.9,
		reviewCount: 52,
		sizes: [
			"XS",
			"S",
			"M",
			"L"
		],
		colors: [C.burgundy, C.blush],
		photo: "photo-1550928431-ee0ec6db30d3",
		isNew: true,
		isBestSeller: false,
		description: "Layered tulle, a corseted waist and softly gathered sleeves. Designed for weddings, receptions and the kind of evenings you photograph.",
		highlights: [
			"Multi-layer tulle skirt",
			"Detachable puff sleeves",
			"Corset back"
		],
		details: {
			fabric: "Nylon tulle over satin lining",
			fit: "Fitted through bodice, full through skirt",
			care: "Dry clean only, steam to release creases",
			origin: "Hand finished in Jaipur, Rajasthan"
		}
	},
	{
		id: "sienna-tiered-cotton-dress",
		name: "Sienna Tiered Cotton Dress",
		category: "Dresses",
		gender: "Women",
		price: 1799,
		originalPrice: null,
		rating: 4.5,
		reviewCount: 143,
		sizes: LETTER_SIZES,
		colors: [
			C.ivory,
			C.sage,
			C.blush
		],
		photo: "photo-1515372039744-b8f02a3ae446",
		isNew: false,
		isBestSeller: true,
		description: "Breathable cotton, an easy off-shoulder neckline and gently tiered skirt. The dress you will reach for on every warm morning.",
		highlights: [
			"Pure cotton weave",
			"Smocked bodice",
			"Tiered skirt"
		],
		details: {
			fabric: "100% cotton poplin",
			fit: "Relaxed fit with stretch neckline",
			care: "Machine wash cold, tumble dry low",
			origin: "Made in India"
		}
	},
	{
		id: "anaya-ruffle-maxi-dress",
		name: "Anaya Ruffle Maxi Dress",
		category: "Dresses",
		gender: "Women",
		price: 3299,
		originalPrice: 3999,
		rating: 4.7,
		reviewCount: 61,
		sizes: [
			"XS",
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [
			C.blush,
			C.ivory,
			C.sky
		],
		photo: "photo-1581044777550-4cfa60707c03",
		isNew: true,
		isBestSeller: false,
		description: "Romantic and unapologetically feminine. A textured maxi with sculptural ruffle sleeves and a softly cinched waist, made for garden parties and long summer evenings.",
		highlights: [
			"Statement ruffle sleeves",
			"Textured jacquard weave",
			"Full length"
		],
		details: {
			fabric: "Cotton-blend jacquard",
			fit: "True to size with room through the skirt",
			care: "Dry clean recommended",
			origin: "Made in India"
		}
	},
	{
		id: "kanira-banarasi-silk-saree",
		name: "Kanira Banarasi Silk Saree",
		category: "Ethnic Wear",
		gender: "Women",
		price: 6499,
		originalPrice: 8999,
		rating: 4.9,
		reviewCount: 187,
		sizes: ONE_SIZE,
		colors: [
			C.indigo,
			C.burgundy,
			C.teal
		],
		photo: "photo-1610030469983-98e550d6193c",
		isNew: false,
		isBestSeller: true,
		description: "A handwoven Banarasi silk saree with a traditional zari border and a deep jewel-toned body. Comes with an unstitched blouse piece so you can tailor it your way.",
		highlights: [
			"Handwoven zari border",
			"Includes 0.8m blouse piece",
			"5.5m length"
		],
		details: {
			fabric: "Art silk with metallic zari",
			fit: "One size, 5.5m saree with blouse piece",
			care: "Dry clean only, store wrapped in muslin",
			origin: "Woven in Varanasi, Uttar Pradesh"
		}
	},
	{
		id: "meher-festive-coord-set",
		name: "Meher Festive Co-ord Set",
		category: "Ethnic Wear",
		gender: "Women",
		price: 4299,
		originalPrice: 5499,
		rating: 4.7,
		reviewCount: 88,
		sizes: [
			"XS",
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [C.wine, C.mustard],
		photo: "photo-1550614000-4895a10e1bfd",
		isNew: false,
		isBestSeller: false,
		description: "Sequin embroidery on a tiered skirt with a matching cropped top and dupatta. Festive dressing that feels modern rather than heavy.",
		highlights: [
			"Three piece set",
			"Hand-embellished sequins",
			"Lined skirt"
		],
		details: {
			fabric: "Georgette with sequin embroidery",
			fit: "Fitted top, flared skirt with drawstring",
			care: "Dry clean only",
			origin: "Hand embroidered in Surat, Gujarat"
		}
	},
	{
		id: "marlow-checked-wool-overcoat",
		name: "Marlow Checked Wool Overcoat",
		category: "Jackets",
		gender: "Women",
		price: 5499,
		originalPrice: 6999,
		rating: 4.6,
		reviewCount: 44,
		sizes: [
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [C.navy, C.charcoal],
		photo: "photo-1485968579580-b6d095142e6e",
		isNew: false,
		isBestSeller: false,
		description: "A tailored wool-blend overcoat in a deep checked weave. Notch lapels, a longline cut and a satin lining that slips easily over knitwear.",
		highlights: [
			"Wool-blend check",
			"Fully lined",
			"Two welt pockets"
		],
		details: {
			fabric: "58% wool, 42% polyester with satin lining",
			fit: "Straight longline fit, layers over knitwear",
			care: "Dry clean only",
			origin: "Made in India"
		}
	},
	{
		id: "aurelie-longline-trench",
		name: "Aurelie Longline Trench",
		category: "Jackets",
		gender: "Women",
		price: 4799,
		originalPrice: null,
		rating: 4.8,
		reviewCount: 67,
		sizes: [
			"XS",
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [
			C.blush,
			C.camel,
			C.stone
		],
		photo: "photo-1485462537746-965f33f7f6a7",
		isNew: true,
		isBestSeller: true,
		description: "The trench, softened. A blush-toned longline coat with a self-tie belt, dropped shoulders and a fluid drape that reads elegant over everything.",
		highlights: [
			"Self-tie belt",
			"Dropped shoulder",
			"Below-knee length"
		],
		details: {
			fabric: "Cotton-blend twill",
			fit: "Oversized, size down for a closer fit",
			care: "Dry clean recommended",
			origin: "Made in India"
		}
	},
	{
		id: "sahara-utility-field-jacket",
		name: "Sahara Utility Field Jacket",
		category: "Jackets",
		gender: "Women",
		price: 3499,
		originalPrice: 4299,
		rating: 4.5,
		reviewCount: 72,
		sizes: [
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [C.olive, C.sand],
		photo: "photo-1544022613-e87ca75a784a",
		isNew: false,
		isBestSeller: false,
		description: "An oversized field jacket in washed cotton twill with four utility pockets and a soft brushed lining. Built to be lived in.",
		highlights: [
			"Four patch pockets",
			"Brushed inner lining",
			"Oversized fit"
		],
		details: {
			fabric: "Washed cotton twill, brushed lining",
			fit: "Deliberately oversized",
			care: "Machine wash cold, do not bleach",
			origin: "Made in India"
		}
	},
	{
		id: "lumen-pleated-trousers",
		name: "Lumen Pleated Trousers",
		category: "Trousers",
		gender: "Women",
		price: 2199,
		originalPrice: 2799,
		rating: 4.4,
		reviewCount: 58,
		sizes: WAIST_SIZES,
		colors: [
			C.blush,
			C.ivory,
			C.black
		],
		photo: "photo-1594633312681-425c7b97ccd1",
		isNew: false,
		isBestSeller: false,
		description: "High-rise pleated trousers with a tapered leg and a tie waist. Sharp enough for the office, soft enough for a Sunday.",
		highlights: [
			"High rise with tie waist",
			"Tapered cuff",
			"Side pockets"
		],
		details: {
			fabric: "Poly-viscose blend with a fluid finish",
			fit: "High rise, tapered leg",
			care: "Machine wash cold, cool iron",
			origin: "Made in India"
		}
	},
	{
		id: "ivory-pleated-blouse",
		name: "Ivory Pleated Sleeveless Blouse",
		category: "Shirts",
		gender: "Women",
		price: 1599,
		originalPrice: 2099,
		rating: 4.6,
		reviewCount: 112,
		sizes: LETTER_SIZES,
		colors: [
			C.ivory,
			C.sky,
			C.black
		],
		photo: "photo-1624206112918-f140f087f9b5",
		isNew: false,
		isBestSeller: true,
		description: "A crisp sleeveless blouse with fine pin pleats down the front and a concealed placket. Tuck it into denim or wear it loose with tailoring.",
		highlights: [
			"Fine pin pleat front",
			"Concealed placket",
			"Mandarin collar"
		],
		details: {
			fabric: "Cotton-poplin blend",
			fit: "Regular fit",
			care: "Machine wash cold, warm iron",
			origin: "Made in India"
		}
	},
	{
		id: "nia-relaxed-graphic-tee",
		name: "Nia Relaxed Graphic Tee",
		category: "T-Shirts",
		gender: "Women",
		price: 999,
		originalPrice: 1299,
		rating: 4.5,
		reviewCount: 205,
		sizes: LETTER_SIZES,
		colors: [
			C.black,
			C.ivory,
			C.rose
		],
		photo: "photo-1503342217505-b0a15ec3261c",
		altPhoto: "photo-1562157873-818bc0726f68",
		isNew: false,
		isBestSeller: false,
		description: "A heavyweight cotton tee with a hand-drawn chest graphic and a slightly cropped, relaxed body. Soft from the first wear.",
		highlights: [
			"180 GSM cotton",
			"Water-based print",
			"Relaxed crop"
		],
		details: {
			fabric: "100% combed cotton, 180 GSM",
			fit: "Relaxed with a shorter body",
			care: "Wash inside out, do not iron on print",
			origin: "Knitted and printed in Tiruppur"
		}
	},
	{
		id: "solstice-lounge-set",
		name: "Solstice Lounge Set",
		category: "Loungewear",
		gender: "Women",
		price: 2799,
		originalPrice: 3499,
		rating: 4.6,
		reviewCount: 91,
		sizes: [
			"XS",
			"S",
			"M",
			"L",
			"XL"
		],
		colors: [
			C.mustard,
			C.stone,
			C.sage
		],
		photo: "photo-1515886657613-9f3515b0c78f",
		isNew: true,
		isBestSeller: false,
		description: "Cropped hoodie and tapered joggers in a brushed fleece-back cotton. Matching, but easy enough to break up and wear separately.",
		highlights: [
			"Two piece set",
			"Fleece-back cotton",
			"Elastic drawcord waist"
		],
		details: {
			fabric: "80% cotton, 20% polyester fleece-back",
			fit: "Relaxed hoodie, tapered joggers",
			care: "Machine wash cold, tumble dry low",
			origin: "Made in India"
		}
	},
	{
		id: "wren-linen-playsuit",
		name: "Wren Linen Playsuit",
		category: "Jumpsuits",
		gender: "Women",
		price: 2399,
		originalPrice: 2999,
		rating: 4.5,
		reviewCount: 69,
		sizes: [
			"XS",
			"S",
			"M",
			"L"
		],
		colors: [
			C.olive,
			C.sand,
			C.black
		],
		photo: "photo-1618932260643-eee4a2f652a6",
		isNew: false,
		isBestSeller: false,
		description: "A breezy linen-blend playsuit with adjustable straps, a drawstring waist and deep side pockets. Warm-weather dressing solved in one piece.",
		highlights: [
			"Adjustable straps",
			"Drawstring waist",
			"Deep pockets"
		],
		details: {
			fabric: "55% linen, 45% viscose",
			fit: "Relaxed through the body",
			care: "Machine wash cold, cool iron while slightly damp",
			origin: "Made in India"
		}
	},
	{
		id: "cove-ribbed-knit-sweater",
		name: "Cove Ribbed Knit Sweater",
		category: "Knitwear",
		gender: "Women",
		price: 2299,
		originalPrice: 2899,
		rating: 4.7,
		reviewCount: 83,
		sizes: LETTER_SIZES,
		colors: [
			C.rust,
			C.stone,
			C.mint
		],
		photo: "photo-1556905055-8f358a7a47b2",
		altPhoto: "photo-1509319117193-57bab727e09d",
		isNew: false,
		isBestSeller: false,
		description: "A soft ribbed knit with dropped shoulders and a ribbed funnel neck. Warm without weight, in colours that sit quietly with everything.",
		highlights: [
			"Chunky rib knit",
			"Dropped shoulder",
			"Funnel neck"
		],
		details: {
			fabric: "Acrylic-cotton blend yarn",
			fit: "Relaxed fit",
			care: "Hand wash cold, dry flat, do not wring",
			origin: "Knitted in Ludhiana, Punjab"
		}
	},
	{
		id: "rowan-leather-biker-jacket",
		name: "Rowan Tan Leather Biker Jacket",
		category: "Jackets",
		gender: "Men",
		price: 8999,
		originalPrice: 11999,
		rating: 4.8,
		reviewCount: 64,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [C.tan, C.black],
		photo: "photo-1487222477894-8943e31ef7b2",
		isNew: false,
		isBestSeller: true,
		description: "A biker jacket in supple full-grain leather with an asymmetric zip, notched lapels and a quilted shoulder panel. It only looks better with age.",
		highlights: [
			"Full-grain leather",
			"Asymmetric YKK zip",
			"Quilted shoulders"
		],
		details: {
			fabric: "Full-grain buffalo leather, viscose lining",
			fit: "Slim fit, sits at the hip",
			care: "Wipe with a dry cloth, condition twice a year",
			origin: "Crafted in Kanpur, Uttar Pradesh"
		}
	},
	{
		id: "dune-rust-bomber-jacket",
		name: "Dune Rust Bomber Jacket",
		category: "Jackets",
		gender: "Men",
		price: 3999,
		originalPrice: 4999,
		rating: 4.6,
		reviewCount: 77,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [
			C.rust,
			C.navy,
			C.olive
		],
		photo: "photo-1591047139829-d91aecb6caea",
		isNew: true,
		isBestSeller: false,
		description: "A clean-lined bomber in a matte technical shell with ribbed trims and a hidden inner pocket. Light enough for evenings, sharp enough for dinner.",
		highlights: [
			"Water-resistant shell",
			"Ribbed collar and cuffs",
			"Hidden inner pocket"
		],
		details: {
			fabric: "Recycled polyester shell with mesh lining",
			fit: "Regular fit",
			care: "Machine wash cold, do not tumble dry",
			origin: "Made in India"
		}
	},
	{
		id: "kade-denim-trucker-jacket",
		name: "Kade Denim Trucker Jacket",
		category: "Jackets",
		gender: "Men",
		price: 3499,
		originalPrice: 4299,
		rating: 4.7,
		reviewCount: 119,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [C.darkDenim, C.midDenim],
		photo: "photo-1611312449408-fcece27cdbb7",
		isNew: false,
		isBestSeller: true,
		description: "Rigid dark-wash denim with a corduroy collar, twin chest pockets and antique brass hardware. A trucker jacket built the old way.",
		highlights: [
			"Corduroy collar",
			"Antique brass hardware",
			"Rigid 12oz denim"
		],
		details: {
			fabric: "12oz non-stretch cotton denim",
			fit: "Regular fit, expect a break-in period",
			care: "Machine wash cold inside out, hang dry",
			origin: "Made in India"
		}
	},
	{
		id: "atlas-printed-chambray-shirt",
		name: "Atlas Printed Chambray Shirt",
		category: "Shirts",
		gender: "Men",
		price: 1899,
		originalPrice: 2499,
		rating: 4.5,
		reviewCount: 96,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [C.midDenim, C.stone],
		photo: "photo-1596755094514-f87e34085b2c",
		altPhoto: "photo-1489987707025-afc232f7ea0f",
		isNew: false,
		isBestSeller: false,
		description: "A soft-washed chambray shirt with a fine all-over print, button-down collar and a single chest pocket. Wear it open over a tee or buttoned with chinos.",
		highlights: [
			"Soft-washed chambray",
			"Button-down collar",
			"Curved hem"
		],
		details: {
			fabric: "100% cotton chambray",
			fit: "Regular fit",
			care: "Machine wash cold, warm iron",
			origin: "Made in India"
		}
	},
	{
		id: "oxford-cotton-shirt",
		name: "Halden Oxford Cotton Shirt",
		category: "Shirts",
		gender: "Men",
		price: 1699,
		originalPrice: 2199,
		rating: 4.6,
		reviewCount: 231,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [
			C.ivory,
			C.charcoal,
			C.burgundy
		],
		photo: "photo-1602810318383-e386cc2a3ccf",
		isNew: false,
		isBestSeller: true,
		description: "The shirt that works with everything. Breathable oxford cotton, a neat spread collar and a trim body that stays sharp from morning to evening.",
		highlights: [
			"Breathable oxford weave",
			"Spread collar",
			"Mother of pearl buttons"
		],
		details: {
			fabric: "100% cotton oxford, 120 GSM",
			fit: "Slim fit through the chest and waist",
			care: "Machine wash cold, warm iron",
			origin: "Made in India"
		}
	},
	{
		id: "sterling-formal-shirt",
		name: "Sterling Formal Slim Shirt",
		category: "Shirts",
		gender: "Men",
		price: 2199,
		originalPrice: 2799,
		rating: 4.7,
		reviewCount: 104,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [
			C.sky,
			C.ivory,
			C.navy
		],
		photo: "photo-1594938291221-94f18cbb5660",
		isNew: false,
		isBestSeller: false,
		description: "A wrinkle-resistant formal shirt in two-ply cotton with a reinforced cutaway collar and single-button cuffs. Made to sit well under a jacket.",
		highlights: [
			"Two-ply cotton",
			"Cutaway collar",
			"Wrinkle resistant finish"
		],
		details: {
			fabric: "2-ply 100% cotton poplin",
			fit: "Slim fit, darted back",
			care: "Machine wash cold, hang to dry, warm iron",
			origin: "Made in India"
		}
	},
	{
		id: "milan-linen-blend-shirt",
		name: "Milan Linen Blend Shirt",
		category: "Shirts",
		gender: "Men",
		price: 2499,
		originalPrice: null,
		rating: 4.8,
		reviewCount: 88,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [
			C.ivory,
			C.sand,
			C.sky
		],
		photo: "photo-1621072156002-e2fccdc0b176",
		isNew: true,
		isBestSeller: false,
		description: "A relaxed linen-blend shirt with a soft camp collar and a straight hem you can wear out. Cool, textured and easy in humid weather.",
		highlights: [
			"Linen-cotton blend",
			"Camp collar",
			"Straight hem"
		],
		details: {
			fabric: "55% linen, 45% cotton",
			fit: "Relaxed fit",
			care: "Machine wash cold, iron while damp",
			origin: "Made in India"
		}
	},
	{
		id: "regent-checked-wool-blazer",
		name: "Regent Checked Wool Blazer",
		category: "Jackets",
		gender: "Men",
		price: 7499,
		originalPrice: 9499,
		rating: 4.8,
		reviewCount: 47,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [C.navy, C.charcoal],
		photo: "photo-1592878904946-b3cd8ae243d0",
		isNew: false,
		isBestSeller: true,
		description: "A half-canvassed blazer in a windowpane check wool blend. Structured shoulders, a two-button front and functional cuff buttons.",
		highlights: [
			"Half-canvas construction",
			"Windowpane check",
			"Functional cuff buttons"
		],
		details: {
			fabric: "60% wool, 40% polyester with bemberg lining",
			fit: "Tailored fit, sits close through the chest",
			care: "Dry clean only",
			origin: "Tailored in Bengaluru, Karnataka"
		}
	},
	{
		id: "essential-crew-neck-tee",
		name: "Essential Crew Neck Tee",
		category: "T-Shirts",
		gender: "Men",
		price: 899,
		originalPrice: 1199,
		rating: 4.6,
		reviewCount: 342,
		sizes: LETTER_SIZES,
		colors: [
			C.ivory,
			C.black,
			C.navy,
			C.olive
		],
		photo: "photo-1521572163474-6864f9cf17ab",
		altPhoto: "photo-1562157873-818bc0726f68",
		isNew: false,
		isBestSeller: true,
		description: "The foundation of the wardrobe. Combed cotton with a ribbed crew neck and twin-needle hems that hold their shape wash after wash.",
		highlights: [
			"Combed cotton, 190 GSM",
			"Ribbed crew neck",
			"Pre-shrunk"
		],
		details: {
			fabric: "100% combed cotton, 190 GSM, bio-washed",
			fit: "Regular fit, true to size",
			care: "Machine wash cold, tumble dry low",
			origin: "Knitted in Tiruppur, Tamil Nadu"
		}
	},
	{
		id: "onyx-oversized-tee",
		name: "Onyx Oversized Tee",
		category: "T-Shirts",
		gender: "Men",
		price: 1099,
		originalPrice: 1399,
		rating: 4.5,
		reviewCount: 158,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [
			C.black,
			C.charcoal,
			C.ivory
		],
		photo: "photo-1622519407650-3df9883f76a5",
		altPhoto: "photo-1576871337622-98d48d1cf531",
		isNew: false,
		isBestSeller: false,
		description: "A heavyweight oversized tee with dropped shoulders and contrast topstitching. Built with enough structure to hold its shape.",
		highlights: [
			"240 GSM heavyweight cotton",
			"Dropped shoulder",
			"Contrast topstitch"
		],
		details: {
			fabric: "100% cotton, 240 GSM",
			fit: "Oversized, size down for a regular fit",
			care: "Machine wash cold inside out",
			origin: "Made in India"
		}
	},
	{
		id: "trail-graphic-print-tee",
		name: "Trail Graphic Print Tee",
		category: "T-Shirts",
		gender: "Men",
		price: 1049,
		originalPrice: 1299,
		rating: 4.4,
		reviewCount: 121,
		sizes: LETTER_SIZES,
		colors: [
			C.ivory,
			C.black,
			C.sage
		],
		photo: "photo-1571945153237-4929e783af4a",
		altPhoto: "photo-1618354691373-d851c5c3a990",
		isNew: false,
		isBestSeller: false,
		description: "A soft cotton tee with a screen-printed back graphic inspired by mountain routes. Washed for a lived-in handfeel.",
		highlights: [
			"Screen printed back graphic",
			"Garment washed",
			"Ribbed neck tape"
		],
		details: {
			fabric: "100% cotton, garment washed",
			fit: "Regular fit",
			care: "Wash inside out, do not iron on print",
			origin: "Made in India"
		}
	},
	{
		id: "ridge-olive-slim-tee",
		name: "Ridge Olive Slim Tee",
		category: "T-Shirts",
		gender: "Men",
		price: 949,
		originalPrice: 1199,
		rating: 4.5,
		reviewCount: 167,
		sizes: LETTER_SIZES,
		colors: [
			C.olive,
			C.charcoal,
			C.sage
		],
		photo: "photo-1519058082700-08a0b56da9b4",
		altPhoto: "photo-1523381210434-271e8be1f52b",
		isNew: false,
		isBestSeller: false,
		description: "A slim-cut tee in a mid-weight cotton slub with a self-fabric neck binding. Clean lines, no branding.",
		highlights: [
			"Cotton slub texture",
			"Self-fabric neck binding",
			"No visible branding"
		],
		details: {
			fabric: "100% cotton slub, 165 GSM",
			fit: "Slim fit",
			care: "Machine wash cold, do not bleach",
			origin: "Made in India"
		}
	},
	{
		id: "nomad-slim-fit-denim",
		name: "Nomad Slim Fit Denim",
		category: "Jeans",
		gender: "Men",
		price: 2299,
		originalPrice: 2999,
		rating: 4.6,
		reviewCount: 276,
		sizes: WAIST_SIZES,
		colors: [
			C.darkDenim,
			C.midDenim,
			C.black
		],
		photo: "photo-1604176354204-9268737828e4",
		altPhoto: "photo-1602293589930-45aad59ba3ab",
		isNew: false,
		isBestSeller: true,
		description: "Stretch denim with a mid rise and a slim, straight leg. Comfortable enough for a long day, clean enough for the evening.",
		highlights: [
			"2% elastane for stretch",
			"Mid rise, slim leg",
			"Five pocket styling"
		],
		details: {
			fabric: "98% cotton, 2% elastane, 11.5oz",
			fit: "Slim through thigh with a straight leg opening",
			care: "Machine wash cold inside out, hang dry",
			origin: "Made in India"
		}
	},
	{
		id: "coast-light-wash-jeans",
		name: "Coast Light Wash Jeans",
		category: "Jeans",
		gender: "Men",
		price: 2499,
		originalPrice: 3199,
		rating: 4.5,
		reviewCount: 143,
		sizes: WAIST_SIZES,
		colors: [C.lightDenim, C.midDenim],
		photo: "photo-1602293589930-45aad59ba3ab",
		altPhoto: "photo-1604176354204-9268737828e4",
		isNew: true,
		isBestSeller: false,
		description: "A relaxed straight-leg jean in a sun-faded light wash with subtle whiskering. Softened in the finish so it feels broken in already.",
		highlights: [
			"Sun-faded light wash",
			"Relaxed straight leg",
			"Softened finish"
		],
		details: {
			fabric: "100% cotton denim, 12oz",
			fit: "Relaxed straight, mid rise",
			care: "Machine wash cold, hang dry",
			origin: "Made in India"
		}
	},
	{
		id: "base-cotton-sweatshirt",
		name: "Base Cotton Sweatshirt",
		category: "Knitwear",
		gender: "Unisex",
		price: 1799,
		originalPrice: 2299,
		rating: 4.6,
		reviewCount: 188,
		sizes: LETTER_SIZES,
		colors: [
			C.ivory,
			C.grey,
			C.black
		],
		photo: "photo-1620799140408-edc6dcb6d633",
		isNew: false,
		isBestSeller: false,
		description: "A clean crew sweatshirt in loopback cotton with set-in sleeves and a ribbed hem. No logos, just a very good sweatshirt.",
		highlights: [
			"Loopback cotton",
			"Set-in sleeves",
			"Ribbed hem and cuffs"
		],
		details: {
			fabric: "80% cotton, 20% polyester loopback, 320 GSM",
			fit: "Regular unisex fit",
			care: "Machine wash cold, tumble dry low",
			origin: "Made in India"
		}
	},
	{
		id: "drift-mint-hoodie",
		name: "Drift Mint Hoodie",
		category: "Knitwear",
		gender: "Unisex",
		price: 2099,
		originalPrice: 2599,
		rating: 4.7,
		reviewCount: 96,
		sizes: [
			"S",
			"M",
			"L",
			"XL",
			"XXL"
		],
		colors: [
			C.mint,
			C.stone,
			C.charcoal
		],
		photo: "photo-1600950207944-0d63e8edbc3f",
		isNew: true,
		isBestSeller: false,
		description: "A relaxed pullover hoodie in brushed fleece with a double-layer hood and kangaroo pocket. The easiest layer in the drawer.",
		highlights: [
			"Double-layer hood",
			"Brushed fleece inside",
			"Kangaroo pocket"
		],
		details: {
			fabric: "70% cotton, 30% polyester brushed fleece",
			fit: "Relaxed unisex fit",
			care: "Machine wash cold, do not bleach",
			origin: "Made in India"
		}
	},
	{
		id: "mira-printed-tote-bag",
		name: "Mira Printed Tote Bag",
		category: "Accessories",
		gender: "Women",
		price: 1899,
		originalPrice: 2499,
		rating: 4.5,
		reviewCount: 74,
		sizes: ONE_SIZE,
		colors: [C.blush, C.ivory],
		photo: "photo-1591561954557-26941169b49e",
		isNew: false,
		isBestSeller: false,
		description: "A structured top-handle tote with a hand-illustrated botanical print and a suede-lined interior. Fits a 13-inch laptop with room to spare.",
		highlights: [
			"Fits a 13-inch laptop",
			"Suede-lined interior",
			"Detachable sling strap"
		],
		details: {
			fabric: "Coated canvas with vegan leather trim",
			fit: "32cm x 26cm x 12cm",
			care: "Wipe clean with a damp cloth",
			origin: "Made in India"
		}
	},
	{
		id: "vela-structured-satchel",
		name: "Vela Structured Satchel",
		category: "Accessories",
		gender: "Women",
		price: 2999,
		originalPrice: 3799,
		rating: 4.7,
		reviewCount: 62,
		sizes: ONE_SIZE,
		colors: [
			C.teal,
			C.black,
			C.tan
		],
		photo: "photo-1594223274512-ad4803739b7c",
		isNew: false,
		isBestSeller: true,
		description: "A compact satchel in pebbled leather with a polished turn-lock closure, two internal compartments and an adjustable chain-and-leather strap.",
		highlights: [
			"Turn-lock closure",
			"Two compartments",
			"Adjustable strap"
		],
		details: {
			fabric: "Pebbled genuine leather, brass hardware",
			fit: "24cm x 17cm x 8cm",
			care: "Store in the dust bag, avoid prolonged sunlight",
			origin: "Crafted in Chennai, Tamil Nadu"
		}
	},
	{
		id: "metro-everyday-backpack",
		name: "Metro Everyday Backpack",
		category: "Accessories",
		gender: "Unisex",
		price: 2299,
		originalPrice: 2899,
		rating: 4.6,
		reviewCount: 131,
		sizes: ONE_SIZE,
		colors: [
			C.navy,
			C.black,
			C.olive
		],
		photo: "photo-1553062407-98eeb64c6a62",
		isNew: true,
		isBestSeller: false,
		description: "A minimal 18-litre backpack in water-repellent recycled nylon with a padded laptop sleeve and a hidden back pocket for essentials.",
		highlights: [
			"18L capacity",
			"Padded 15-inch laptop sleeve",
			"Water repellent"
		],
		details: {
			fabric: "Recycled nylon with PU coating",
			fit: "44cm x 29cm x 14cm, 18 litres",
			care: "Spot clean, do not machine wash",
			origin: "Made in India"
		}
	},
	{
		id: "bloom-stiletto-heels",
		name: "Bloom Stiletto Heels",
		category: "Accessories",
		gender: "Women",
		price: 2799,
		originalPrice: 3499,
		rating: 4.4,
		reviewCount: 58,
		sizes: SHOE_SIZES,
		colors: [C.sky, C.black],
		photo: "photo-1543163521-1bf539c55dd2",
		isNew: false,
		isBestSeller: false,
		description: "A pointed-toe stiletto in a painterly floral satin with a padded footbed and a 9cm heel that stays comfortable through the evening.",
		highlights: [
			"9cm stiletto heel",
			"Padded footbed",
			"Non-slip sole"
		],
		details: {
			fabric: "Printed satin upper, leather footbed",
			fit: "True to size, narrow toe box",
			care: "Wipe with a soft dry cloth",
			origin: "Made in India"
		}
	},
	{
		id: "court-leather-sneakers",
		name: "Court Leather Sneakers",
		category: "Accessories",
		gender: "Unisex",
		price: 3299,
		originalPrice: 3999,
		rating: 4.7,
		reviewCount: 204,
		sizes: SHOE_SIZES,
		colors: [C.ivory, C.black],
		photo: "photo-1608231387042-66d1773070a5",
		altPhoto: "photo-1600185365483-26d7a4cc7519",
		isNew: false,
		isBestSeller: true,
		description: "A low-profile court sneaker in full-grain leather with perforated side panels, a cushioned insole and a vulcanised rubber sole.",
		highlights: [
			"Full-grain leather upper",
			"Cushioned removable insole",
			"Vulcanised sole"
		],
		details: {
			fabric: "Full-grain leather with rubber outsole",
			fit: "True to size, roomy toe box",
			care: "Clean with a soft brush, use leather conditioner",
			origin: "Made in India"
		}
	},
	{
		id: "wilder-leather-belt",
		name: "Wilder Leather Belt",
		category: "Accessories",
		gender: "Men",
		price: 1299,
		originalPrice: 1699,
		rating: 4.5,
		reviewCount: 89,
		sizes: ONE_SIZE,
		colors: [C.tan, C.black],
		photo: "photo-1479064555552-3ef4979f8908",
		isNew: false,
		isBestSeller: false,
		description: "A 35mm full-grain leather belt with a brushed antique buckle and hand-burnished edges. Cut to length so it fits exactly.",
		highlights: [
			"35mm full-grain leather",
			"Brushed antique buckle",
			"Hand-burnished edges"
		],
		details: {
			fabric: "Full-grain vegetable-tanned leather",
			fit: "Trim to size, fits waist 28in - 40in",
			care: "Condition occasionally, keep away from water",
			origin: "Crafted in Kanpur, Uttar Pradesh"
		}
	}
];
/** Adds derived fields so the rest of the app never recalculates them. */
function decorate(raw) {
	const discount = raw.originalPrice ? Math.round((1 - raw.price / raw.originalPrice) * 100) : 0;
	return {
		...raw,
		discount,
		isSale: discount > 0,
		images: galleryFor(raw.photo, raw.altPhoto),
		/** Lower-cased haystack used by the search overlay. */
		searchIndex: [
			raw.name,
			raw.category,
			raw.gender,
			raw.description,
			...raw.highlights || []
		].join(" ").toLowerCase()
	};
}
var products = RAW.map(decorate);
var getProductById = (id) => products.find((p) => p.id === id);
var CATEGORIES = [...new Set(products.map((p) => p.category))].sort();
var GENDERS = [
	"Women",
	"Men",
	"Unisex"
];
var SIZE_GROUPS = [
	{
		label: "Clothing",
		sizes: LETTER_SIZES
	},
	{
		label: "Waist",
		sizes: WAIST_SIZES
	},
	{
		label: "Footwear",
		sizes: SHOE_SIZES
	}
];
Math.ceil(Math.max(...products.map((p) => p.price)) / 500) * 500;
var SORT_OPTIONS = [
	{
		value: "featured",
		label: "Featured"
	},
	{
		value: "new",
		label: "Newest first"
	},
	{
		value: "price-asc",
		label: "Price: low to high"
	},
	{
		value: "price-desc",
		label: "Price: high to low"
	},
	{
		value: "rating",
		label: "Top rated"
	},
	{
		value: "discount",
		label: "Biggest discount"
	}
];
var newArrivals = products.filter((p) => p.isNew);
var bestSellers = products.filter((p) => p.isBestSeller);
products.filter((p) => p.isSale).sort((a, b) => b.discount - a.discount);
/** Products from the same category, excluding the current one. */
function relatedProducts(product, limit = 4) {
	if (!product) return [];
	const sameCategory = products.filter((p) => p.id !== product.id && p.category === product.category);
	const sameGender = products.filter((p) => p.id !== product.id && p.gender === product.gender && p.category !== product.category);
	return [...sameCategory, ...sameGender].slice(0, limit);
}
//#endregion
//#region src/context/CartContext.jsx
var CartContext = createContext(null);
var STORAGE_KEY$1 = "vera:cart:v1";
/** A bag line is unique per product + size + colour combination. */
var lineKey = (productId, size, color) => `${productId}|${size || "os"}|${color || "default"}`;
function CartProvider({ children }) {
	const [rawItems, setRawItems] = useLocalStorage(STORAGE_KEY$1, []);
	/** Rehydrate stored lines against the catalogue and drop anything stale. */
	const items = useMemo(() => (Array.isArray(rawItems) ? rawItems : []).map((line) => {
		const product = getProductById(line.productId);
		if (!product) return null;
		const quantity = Math.min(Math.max(Number(line.quantity) || 1, 1), 10);
		return {
			key: lineKey(product.id, line.size, line.color),
			productId: product.id,
			product,
			size: line.size || (product.sizes?.[0] ?? "One Size"),
			color: line.color || product.colors?.[0]?.name || "Default",
			quantity,
			lineTotal: product.price * quantity
		};
	}).filter(Boolean), [rawItems]);
	const addItem = useCallback((product, { size, color, quantity = 1 } = {}) => {
		if (!product) return;
		const resolvedSize = size || product.sizes?.[0] || "One Size";
		const resolvedColor = color || product.colors?.[0]?.name || "Default";
		setRawItems((current) => {
			const list = Array.isArray(current) ? [...current] : [];
			const index = list.findIndex((line) => line.productId === product.id && (line.size || "os") === resolvedSize && (line.color || "default") === resolvedColor);
			if (index > -1) {
				const nextQuantity = Math.min((Number(list[index].quantity) || 1) + quantity, 10);
				list[index] = {
					...list[index],
					quantity: nextQuantity
				};
				return list;
			}
			return [...list, {
				productId: product.id,
				size: resolvedSize,
				color: resolvedColor,
				quantity: Math.min(quantity, 10)
			}];
		});
	}, [setRawItems]);
	const updateQuantity = useCallback((key, quantity) => {
		const next = Math.min(Math.max(quantity, 1), 10);
		setRawItems((current) => (Array.isArray(current) ? current : []).map((line) => lineKey(line.productId, line.size, line.color) === key ? {
			...line,
			quantity: next
		} : line));
	}, [setRawItems]);
	const increment = useCallback((key) => {
		const line = items.find((item) => item.key === key);
		if (line) updateQuantity(key, line.quantity + 1);
	}, [items, updateQuantity]);
	const decrement = useCallback((key) => {
		const line = items.find((item) => item.key === key);
		if (line) updateQuantity(key, line.quantity - 1);
	}, [items, updateQuantity]);
	const removeItem = useCallback((key) => {
		setRawItems((current) => (Array.isArray(current) ? current : []).filter((line) => lineKey(line.productId, line.size, line.color) !== key));
	}, [setRawItems]);
	const clearCart = useCallback(() => setRawItems([]), [setRawItems]);
	const totals = useMemo(() => {
		const totalItems = items.reduce((sum, line) => sum + line.quantity, 0);
		const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
		const listTotal = items.reduce((sum, line) => sum + (line.product.originalPrice || line.product.price) * line.quantity, 0);
		const savings = Math.max(0, listTotal - subtotal);
		const delivery = subtotal === 0 || subtotal >= store.freeShippingThreshold ? 0 : store.deliveryFee;
		return {
			totalItems,
			subtotal,
			listTotal,
			savings,
			delivery,
			total: subtotal + delivery,
			qualifiesForFreeShipping: subtotal >= store.freeShippingThreshold,
			amountToFreeShipping: Math.max(0, store.freeShippingThreshold - subtotal)
		};
	}, [items]);
	const value = useMemo(() => ({
		items,
		addItem,
		removeItem,
		increment,
		decrement,
		updateQuantity,
		clearCart,
		...totals,
		isEmpty: items.length === 0
	}), [
		items,
		addItem,
		removeItem,
		increment,
		decrement,
		updateQuantity,
		clearCart,
		totals
	]);
	return /* @__PURE__ */ jsx(CartContext.Provider, {
		value,
		children
	});
}
function useCart() {
	const context = useContext(CartContext);
	if (!context) throw new Error("useCart must be used inside <CartProvider>");
	return context;
}
//#endregion
//#region src/context/WishlistContext.jsx
var WishlistContext = createContext(null);
var STORAGE_KEY = "vera:wishlist:v1";
function WishlistProvider({ children }) {
	const [ids, setIds] = useLocalStorage(STORAGE_KEY, []);
	const safeIds = useMemo(() => Array.isArray(ids) ? ids : [], [ids]);
	const items = useMemo(() => safeIds.map(getProductById).filter(Boolean), [safeIds]);
	const isWishlisted = useCallback((productId) => safeIds.includes(productId), [safeIds]);
	const add = useCallback((productId) => setIds((current) => {
		const list = Array.isArray(current) ? current : [];
		return list.includes(productId) ? list : [productId, ...list];
	}), [setIds]);
	const remove = useCallback((productId) => setIds((current) => (Array.isArray(current) ? current : []).filter((id) => id !== productId)), [setIds]);
	/** Returns true when the product ended up in the wishlist. */
	const toggle = useCallback((productId) => {
		const nowWishlisted = !safeIds.includes(productId);
		if (nowWishlisted) add(productId);
		else remove(productId);
		return nowWishlisted;
	}, [
		safeIds,
		add,
		remove
	]);
	const clear = useCallback(() => setIds([]), [setIds]);
	const value = useMemo(() => ({
		items,
		ids: safeIds,
		count: items.length,
		isWishlisted,
		add,
		remove,
		toggle,
		clear,
		isEmpty: items.length === 0
	}), [
		items,
		safeIds,
		isWishlisted,
		add,
		remove,
		toggle,
		clear
	]);
	return /* @__PURE__ */ jsx(WishlistContext.Provider, {
		value,
		children
	});
}
function useWishlist() {
	const context = useContext(WishlistContext);
	if (!context) throw new Error("useWishlist must be used inside <WishlistProvider>");
	return context;
}
//#endregion
//#region src/context/UIContext.jsx
var UIContext = createContext(null);
/** Shared open/close state for the search overlay and the bag drawer. */
function UIProvider({ children }) {
	const [isSearchOpen, setSearchOpen] = useState(false);
	const [isCartOpen, setCartOpen] = useState(false);
	const openSearch = useCallback(() => {
		setCartOpen(false);
		setSearchOpen(true);
	}, []);
	const closeSearch = useCallback(() => setSearchOpen(false), []);
	const openCart = useCallback(() => {
		setSearchOpen(false);
		setCartOpen(true);
	}, []);
	const closeCart = useCallback(() => setCartOpen(false), []);
	const value = useMemo(() => ({
		isSearchOpen,
		openSearch,
		closeSearch,
		isCartOpen,
		openCart,
		closeCart
	}), [
		isSearchOpen,
		openSearch,
		closeSearch,
		isCartOpen,
		openCart,
		closeCart
	]);
	return /* @__PURE__ */ jsx(UIContext.Provider, {
		value,
		children
	});
}
function useUI() {
	const context = useContext(UIContext);
	if (!context) throw new Error("useUI must be used inside <UIProvider>");
	return context;
}
//#endregion
//#region src/hooks/useScrollLock.js
var lockCount = 0;
/**
* Prevents the page behind an overlay from scrolling.
* Reference counted so nested overlays (drawer + modal) behave correctly.
*/
function useScrollLock(active) {
	useEffect(() => {
		if (!active) return void 0;
		lockCount += 1;
		document.body.dataset.scrollLocked = "true";
		return () => {
			lockCount = Math.max(0, lockCount - 1);
			if (lockCount === 0) delete document.body.dataset.scrollLocked;
		};
	}, [active]);
}
//#endregion
//#region src/utils/format.js
var currencyFormatter = new Intl.NumberFormat(store.locale, {
	style: "currency",
	currency: store.currency,
	maximumFractionDigits: 0
});
new Intl.NumberFormat(store.locale);
/** 2499 -> "Rs.2,499" rendered with the native rupee glyph. */
var formatPrice = (value) => currencyFormatter.format(Number(value) || 0);
/** Pluralise a countable noun: pluralise(1, 'item') -> "1 item" */
var pluralise = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;
/** Order ids look like VRA-8F2K41 */
function generateOrderId() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * 32)];
	return `VRA-${code}`;
}
/** A friendly delivery window, e.g. "Fri, 18 Sep - Mon, 21 Sep" */
function deliveryWindow(fromDays = 3, toDays = 6) {
	const options = {
		weekday: "short",
		day: "numeric",
		month: "short"
	};
	const start = /* @__PURE__ */ new Date();
	start.setDate(start.getDate() + fromDays);
	const end = /* @__PURE__ */ new Date();
	end.setDate(end.getDate() + toDays);
	const fmt = new Intl.DateTimeFormat(store.locale, options);
	return `${fmt.format(start)} - ${fmt.format(end)}`;
}
/** Joins class names, ignoring falsy values. */
var cx = (...classes) => classes.filter(Boolean).join(" ");
//#endregion
//#region src/components/Navbar.jsx
var NAV_LINKS = [
	{
		label: "Home",
		to: "/"
	},
	{
		label: "Shop",
		to: "/shop"
	},
	{
		label: "Women",
		to: "/shop?gender=Women"
	},
	{
		label: "Men",
		to: "/shop?gender=Men"
	},
	{
		label: "New Arrivals",
		to: "/shop?tag=new"
	},
	{
		label: "About",
		to: "/about"
	}
];
var MOBILE_EXTRA_LINKS = [
	{
		label: "Best Sellers",
		to: "/shop?tag=bestseller"
	},
	{
		label: "Sale",
		to: "/shop?tag=sale"
	},
	{
		label: "Wishlist",
		to: "/wishlist"
	},
	{
		label: "Contact",
		to: "/contact"
	}
];
function IconButton({ label, onClick, to, children, badge }) {
	const content = /* @__PURE__ */ jsxs(Fragment, { children: [
		children,
		badge > 0 && /* @__PURE__ */ jsx("span", {
			className: "absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center bg-clay px-1 text-[9px] font-normal tabular-nums text-cream",
			children: badge > 99 ? "99+" : badge
		}),
		/* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: label
		})
	] });
	const className = "relative flex h-10 w-10 items-center justify-center text-ink transition-colors duration-200 hover:text-clay";
	if (to) return /* @__PURE__ */ jsx(Link, {
		to,
		className,
		"aria-label": label,
		children: content
	});
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		className,
		"aria-label": label,
		children: content
	});
}
/** Sticky header. Condenses and gains a hairline border once the page scrolls. */
function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const { totalItems } = useCart();
	const { count: wishlistCount } = useWishlist();
	const { openSearch, openCart } = useUI();
	const location = useLocation();
	useScrollLock(mobileOpen);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname, location.search]);
	const isActive = (to) => {
		const [path, query] = to.split("?");
		if (path !== location.pathname) return false;
		if (!query) return location.search === "" || path !== "/shop";
		return location.search.includes(query);
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("div", {
			className: "bg-ink text-cream",
			children: /* @__PURE__ */ jsx("div", {
				className: "shell flex h-9 items-center justify-center overflow-hidden",
				children: /* @__PURE__ */ jsx("p", {
					className: "truncate text-[10px] uppercase tracking-[0.22em] text-cream/85",
					children: store.announcements[0]
				})
			})
		}),
		/* @__PURE__ */ jsx("header", {
			className: cx("sticky top-0 z-50 border-b transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", scrolled ? "border-line bg-cream/92 backdrop-blur-md" : "border-transparent bg-cream"),
			children: /* @__PURE__ */ jsx("div", {
				className: "shell",
				children: /* @__PURE__ */ jsxs("div", {
					className: cx("relative flex items-center justify-between transition-all duration-300", scrolled ? "h-16" : "h-20 lg:h-24"),
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setMobileOpen(true),
							"aria-label": "Open menu",
							"aria-expanded": mobileOpen,
							className: "-ml-2 flex h-10 w-10 items-center justify-center text-ink lg:hidden",
							children: /* @__PURE__ */ jsx(Menu, {
								size: 20,
								strokeWidth: 1.4
							})
						}),
						/* @__PURE__ */ jsx("nav", {
							"aria-label": "Primary",
							className: "hidden lg:flex lg:flex-1 lg:items-center lg:gap-8",
							children: NAV_LINKS.map((link) => /* @__PURE__ */ jsx(NavLink, {
								to: link.to,
								"data-active": isActive(link.to),
								className: "link-underline text-[11px] font-normal uppercase tracking-[0.2em] text-ink transition-colors hover:text-clay",
								children: link.label
							}, link.label))
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/",
							"aria-label": `${store.storeNamePlain} home`,
							className: "absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0",
							children: /* @__PURE__ */ jsx("span", {
								className: cx("block font-sans font-medium leading-none text-ink transition-all duration-300", scrolled ? "text-[1.15rem]" : "text-[1.35rem] lg:text-[1.6rem]"),
								style: { letterSpacing: "0.3em" },
								children: store.storeName
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-1 items-center justify-end gap-0.5 sm:gap-1",
							children: [
								/* @__PURE__ */ jsx(IconButton, {
									label: "Search",
									onClick: openSearch,
									children: /* @__PURE__ */ jsx(Search, {
										size: 19,
										strokeWidth: 1.4
									})
								}),
								/* @__PURE__ */ jsx("span", {
									className: "hidden sm:block",
									children: /* @__PURE__ */ jsx(IconButton, {
										label: "Wishlist",
										to: "/wishlist",
										badge: wishlistCount,
										children: /* @__PURE__ */ jsx(Heart, {
											size: 19,
											strokeWidth: 1.4
										})
									})
								}),
								/* @__PURE__ */ jsx(IconButton, {
									label: "Open bag",
									onClick: openCart,
									badge: totalItems,
									children: /* @__PURE__ */ jsx(ShoppingBag, {
										size: 19,
										strokeWidth: 1.4
									})
								})
							]
						})
					]
				})
			})
		}),
		mobileOpen && /* @__PURE__ */ jsxs("div", {
			className: "fixed inset-0 z-[96] lg:hidden",
			children: [/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": "Close menu",
				onClick: () => setMobileOpen(false),
				className: "absolute inset-0 animate-fade-in cursor-default bg-ink/40 backdrop-blur-[2px]"
			}), /* @__PURE__ */ jsxs("nav", {
				"aria-label": "Mobile",
				className: "absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] animate-slide-in-left flex-col bg-cream shadow-panel",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between border-b border-line px-5 py-5",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-sans text-lg font-medium text-ink",
							style: { letterSpacing: "0.3em" },
							children: store.storeName
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setMobileOpen(false),
							"aria-label": "Close menu",
							className: "flex h-9 w-9 items-center justify-center text-ink",
							children: /* @__PURE__ */ jsx(X, {
								size: 19,
								strokeWidth: 1.4
							})
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex-1 overflow-y-auto px-5 py-7",
						children: [/* @__PURE__ */ jsx("ul", {
							className: "space-y-1",
							children: NAV_LINKS.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
								to: link.to,
								className: "block py-3 font-display text-2xl text-ink transition-colors hover:text-clay",
								children: link.label
							}) }, link.label))
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-8 border-t border-line pt-6",
							children: [/* @__PURE__ */ jsx("p", {
								className: "eyebrow mb-4",
								children: "More"
							}), /* @__PURE__ */ jsx("ul", {
								className: "space-y-3",
								children: MOBILE_EXTRA_LINKS.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
									to: link.to,
									className: "text-sm text-slate transition-colors hover:text-ink",
									children: link.label
								}) }, link.label))
							})]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "border-t border-line px-5 py-5 text-xs text-muted",
						children: [/* @__PURE__ */ jsx("p", { children: store.phone }), /* @__PURE__ */ jsx("p", {
							className: "mt-1",
							children: store.email
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/context/ToastContext.jsx
var ToastContext = createContext(null);
var DURATION = 3200;
function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const timers = useRef(/* @__PURE__ */ new Map());
	const dismiss = useCallback((id) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);
	const toast = useCallback((message, options = {}) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		const entry = {
			id,
			message,
			tone: options.tone || "default",
			description: options.description,
			icon: options.icon
		};
		setToasts((current) => [...current.slice(-2), entry]);
		timers.current.set(id, setTimeout(() => dismiss(id), options.duration || DURATION));
		return id;
	}, [dismiss]);
	const value = useMemo(() => ({
		toasts,
		toast,
		dismiss
	}), [
		toasts,
		toast,
		dismiss
	]);
	return /* @__PURE__ */ jsx(ToastContext.Provider, {
		value,
		children
	});
}
function useToast() {
	const context = useContext(ToastContext);
	if (!context) throw new Error("useToast must be used inside <ToastProvider>");
	return context;
}
//#endregion
//#region src/components/Newsletter.jsx
var EMAIL_PATTERN$2 = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Newsletter capture used in the footer. Validates locally, no backend. */
function Newsletter() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);
	const { toast } = useToast();
	const submit = (event) => {
		event.preventDefault();
		if (!EMAIL_PATTERN$2.test(email.trim())) {
			setError("Enter a valid email address so we can reach you.");
			return;
		}
		setError("");
		setDone(true);
		toast("You are on the list", { description: "Look out for our next collection drop." });
	};
	return /* @__PURE__ */ jsx("section", {
		className: "shell py-16 lg:py-20",
		"aria-labelledby": "newsletter-heading",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[10px] uppercase tracking-[0.28em] text-cream/45",
					children: "Newsletter"
				}),
				/* @__PURE__ */ jsx("h2", {
					id: "newsletter-heading",
					className: "mt-4 text-[2.2rem] leading-[1.1] text-cream sm:text-[2.8rem]",
					children: "Stay in Style."
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-4 max-w-md text-sm leading-relaxed text-cream/60",
					children: store.newsletterOffer
				})
			] }), /* @__PURE__ */ jsx("div", { children: done ? /* @__PURE__ */ jsxs("div", {
				className: "flex items-start gap-3.5 border border-cream/20 bg-cream/5 px-6 py-7",
				children: [/* @__PURE__ */ jsx(CircleCheckBig, {
					size: 20,
					strokeWidth: 1.3,
					className: "mt-0.5 shrink-0 text-clay"
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
					className: "font-display text-xl text-cream",
					children: [
						"Welcome to ",
						store.storeName,
						"."
					]
				}), /* @__PURE__ */ jsxs("p", {
					className: "mt-1.5 text-sm text-cream/60",
					children: [
						"We have added ",
						email.trim(),
						" to the list. Your first look lands soon."
					]
				})] })]
			}) : /* @__PURE__ */ jsxs("form", {
				onSubmit: submit,
				noValidate: true,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-3 sm:flex-row",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ jsx("label", {
							htmlFor: "newsletter-email",
							className: "sr-only",
							children: "Email address"
						}), /* @__PURE__ */ jsx("input", {
							id: "newsletter-email",
							type: "email",
							value: email,
							onChange: (event) => {
								setEmail(event.target.value);
								if (error) setError("");
							},
							placeholder: "your@email.com",
							"aria-invalid": Boolean(error),
							"aria-describedby": error ? "newsletter-error" : void 0,
							className: "w-full border border-cream/25 bg-transparent px-4 py-4 text-sm text-cream outline-none transition-colors placeholder:text-cream/35 hover:border-cream/45 focus:border-cream"
						})]
					}), /* @__PURE__ */ jsxs("button", {
						type: "submit",
						className: "group inline-flex items-center justify-center gap-2.5 bg-cream px-8 py-4 text-[11px] font-normal uppercase tracking-[0.22em] text-ink transition-colors duration-300 hover:bg-clay hover:text-cream",
						children: ["Join us", /* @__PURE__ */ jsx(ArrowRight, {
							size: 14,
							strokeWidth: 1.5,
							className: "transition-transform duration-300 group-hover:translate-x-1"
						})]
					})]
				}), error ? /* @__PURE__ */ jsx("p", {
					id: "newsletter-error",
					role: "alert",
					className: "mt-3 text-xs text-clay",
					children: error
				}) : /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-xs text-cream/40",
					children: "No spam. Unsubscribe whenever you like."
				})]
			}) })]
		})
	});
}
//#endregion
//#region src/components/icons/SocialIcons.jsx
/**
* Brand marks are not part of the Lucide icon set, so the three we need are
* defined here as inline SVG. They inherit `currentColor` and accept a size.
*/
var base = (size) => ({
	width: size,
	height: size,
	viewBox: "0 0 24 24",
	"aria-hidden": "true",
	focusable: "false"
});
function InstagramIcon({ size = 18, className }) {
	return /* @__PURE__ */ jsxs("svg", {
		...base(size),
		className,
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.4",
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "3",
				y: "3",
				width: "18",
				height: "18",
				rx: "5"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "4"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "17.2",
				cy: "6.8",
				r: "1",
				fill: "currentColor",
				stroke: "none"
			})
		]
	});
}
function FacebookIcon({ size = 18, className }) {
	return /* @__PURE__ */ jsx("svg", {
		...base(size),
		className,
		fill: "currentColor",
		children: /* @__PURE__ */ jsx("path", { d: "M13.5 21v-7.2h2.4l.4-2.9h-2.8V9.1c0-.8.2-1.4 1.4-1.4h1.5V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.5V21h3z" })
	});
}
function WhatsAppIcon({ size = 18, className }) {
	return /* @__PURE__ */ jsx("svg", {
		...base(size),
		className,
		fill: "currentColor",
		children: /* @__PURE__ */ jsx("path", { d: "M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.86.5 3.6 1.4 5.1L2 22l5.2-1.55a9.9 9.9 0 0 0 4.84 1.25h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Zm0 18.03a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.92.93-3.02-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.51 3.68-8.18 8.2-8.18 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.52-3.68 8.08-8.29 8.08Zm4.5-6.1c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.66.8-.81.97-.15.16-.3.18-.55.06a6.7 6.7 0 0 1-1.97-1.21 7.4 7.4 0 0 1-1.36-1.7c-.14-.25-.01-.39.11-.51.11-.12.25-.3.37-.45.12-.15.16-.25.25-.42.08-.16.04-.31-.03-.44-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02 0 1.19.86 2.34.98 2.5.12.17 1.68 2.65 4.08 3.62 1.42.57 1.98.62 2.69.51.43-.06 1.35-.55 1.54-1.09.19-.53.19-.99.13-1.09-.06-.1-.22-.16-.47-.28Z" })
	});
}
//#endregion
//#region src/components/Footer.jsx
var COLUMNS = [
	{
		title: store.storeName,
		links: [
			{
				label: "About us",
				to: "/about"
			},
			{
				label: "Contact",
				to: "/contact"
			},
			{
				label: "Store locator",
				to: "/contact#stores"
			},
			{
				label: "FAQs",
				to: "/info/faqs"
			}
		]
	},
	{
		title: "Shop",
		links: [
			{
				label: "Women",
				to: "/shop?gender=Women"
			},
			{
				label: "Men",
				to: "/shop?gender=Men"
			},
			{
				label: "New Arrivals",
				to: "/shop?tag=new"
			},
			{
				label: "Best Sellers",
				to: "/shop?tag=bestseller"
			},
			{
				label: "Sale",
				to: "/shop?tag=sale"
			}
		]
	},
	{
		title: "Help",
		links: [
			{
				label: "Shipping",
				to: "/info/shipping"
			},
			{
				label: "Returns",
				to: "/info/returns"
			},
			{
				label: "Size Guide",
				to: "/info/size-guide"
			},
			{
				label: "Privacy Policy",
				to: "/info/privacy"
			},
			{
				label: "Terms",
				to: "/info/terms"
			}
		]
	}
];
var SOCIALS = [
	{
		label: "Instagram",
		href: store.instagram,
		Icon: InstagramIcon
	},
	{
		label: "Facebook",
		href: store.facebook,
		Icon: FacebookIcon
	},
	{
		label: "WhatsApp",
		href: whatsappLink(),
		Icon: WhatsAppIcon
	}
];
function Footer() {
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	return /* @__PURE__ */ jsxs("footer", {
		className: "mt-24 bg-ink text-cream",
		children: [
			/* @__PURE__ */ jsx(Newsletter, {}),
			/* @__PURE__ */ jsxs("div", {
				className: "shell grid gap-12 border-t border-cream/10 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10 lg:py-20",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "sm:col-span-2 lg:col-span-2",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "block font-sans text-xl font-medium text-cream",
							style: { letterSpacing: "0.3em" },
							children: store.storeName
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-5 max-w-xs font-display text-xl leading-snug text-cream/80",
							children: store.tagline
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-4 max-w-xs text-sm leading-relaxed text-cream/55",
							children: [
								"An independent fashion label since ",
								store.established,
								", designing considered clothing for everyday life."
							]
						}),
						/* @__PURE__ */ jsxs("ul", {
							className: "mt-7 space-y-3 text-sm text-cream/70",
							children: [
								/* @__PURE__ */ jsxs("li", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ jsx(MapPin, {
										size: 15,
										strokeWidth: 1.4,
										className: "mt-0.5 shrink-0 text-clay"
									}), /* @__PURE__ */ jsx("span", { children: formattedAddress })]
								}),
								/* @__PURE__ */ jsxs("li", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ jsx(Phone, {
										size: 15,
										strokeWidth: 1.4,
										className: "mt-0.5 shrink-0 text-clay"
									}), /* @__PURE__ */ jsx("a", {
										href: telLink,
										className: "transition-colors hover:text-cream",
										children: store.phone
									})]
								}),
								/* @__PURE__ */ jsxs("li", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ jsx(Mail, {
										size: 15,
										strokeWidth: 1.4,
										className: "mt-0.5 shrink-0 text-clay"
									}), /* @__PURE__ */ jsx("a", {
										href: mailtoLink,
										className: "transition-colors hover:text-cream",
										children: store.email
									})]
								})
							]
						})
					]
				}), COLUMNS.map((column) => /* @__PURE__ */ jsxs("nav", {
					"aria-label": column.title,
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-sans text-[10px] font-normal uppercase tracking-[0.24em] text-cream/50",
						children: column.title
					}), /* @__PURE__ */ jsx("ul", {
						className: "mt-5 space-y-3",
						children: column.links.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
							to: link.to,
							className: "text-sm text-cream/75 transition-colors hover:text-cream",
							children: link.label
						}) }, link.label))
					})]
				}, column.title))]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "shell flex flex-col gap-6 border-t border-cream/10 py-7 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-3",
					children: SOCIALS.map(({ label, href, Icon }) => /* @__PURE__ */ jsx("a", {
						href,
						target: "_blank",
						rel: "noreferrer noopener",
						"aria-label": `${store.storeNamePlain} on ${label}`,
						className: "flex h-10 w-10 items-center justify-center border border-cream/20 text-cream/70 transition-colors hover:border-cream hover:text-cream",
						children: /* @__PURE__ */ jsx(Icon, { size: 17 })
					}, label))
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-1 text-xs text-cream/45 sm:items-end",
					children: [/* @__PURE__ */ jsxs("p", { children: [
						"©",
						" ",
						year,
						" ",
						store.storeNamePlain,
						" Fashion. All rights reserved."
					] }), /* @__PURE__ */ jsx("p", { children: "Demonstration storefront. Prices and stock are illustrative." })]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/PageMeta.jsx
var upsertMeta = (attribute, key, content) => {
	if (!content) return;
	let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
	if (!tag) {
		tag = document.createElement("meta");
		tag.setAttribute(attribute, key);
		document.head.appendChild(tag);
	}
	tag.setAttribute("content", content);
};
/**
* Per-route document title and meta description.
* A small hand-rolled alternative to pulling in a head-management library.
*/
function PageMeta({ title, description }) {
	useEffect(() => {
		const fullTitle = title ? `${store.storeName} | ${title}` : `${store.storeName} | Premium Fashion`;
		document.title = fullTitle;
		upsertMeta("name", "description", description);
		upsertMeta("property", "og:title", fullTitle);
		upsertMeta("property", "og:description", description);
	}, [title, description]);
	return null;
}
//#endregion
//#region src/components/Button.jsx
var BASE = "group relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-sans font-normal uppercase transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-45";
var VARIANTS = {
	primary: "bg-ink text-cream hover:bg-clay",
	outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-cream",
	light: "bg-cream text-ink hover:bg-clay hover:text-cream",
	ghostLight: "border border-cream/35 text-cream hover:bg-cream hover:text-ink",
	subtle: "bg-sand text-ink hover:bg-shell",
	quiet: "text-ink hover:text-clay"
};
var SIZES = {
	sm: "px-5 py-2.5 text-[10px] tracking-[0.2em]",
	md: "px-7 py-3.5 text-[11px] tracking-[0.22em]",
	lg: "px-9 py-[1.15rem] text-[11px] tracking-[0.26em]"
};
/**
* The single button primitive used across the store.
* Renders as <button>, <Link> (when `to` is set) or <a> (when `href` is set).
*/
function Button({ as, to, href, variant = "primary", size = "md", full = false, className, children, ...rest }) {
	const classes = cx(BASE, VARIANTS[variant] || VARIANTS.primary, SIZES[size] || SIZES.md, full && "w-full", className);
	if (to) return /* @__PURE__ */ jsx(Link, {
		to,
		className: classes,
		...rest,
		children
	});
	if (href) return /* @__PURE__ */ jsx("a", {
		className: classes,
		href,
		...rest,
		children
	});
	const Component = as || "button";
	return /* @__PURE__ */ jsx(Component, {
		className: classes,
		type: Component === "button" ? "button" : void 0,
		...rest,
		children
	});
}
//#endregion
//#region src/components/SmartImage.jsx
/**
* Image with a fade-in, a shimmer placeholder and a graceful fallback.
* `alt` is required so every image on the site stays accessible.
*/
function SmartImage({ src, alt, className, wrapperClassName, ratio = "aspect-[3/4]", loading = "lazy", priority = false, sizes }) {
	const [status, setStatus] = useState("loading");
	useEffect(() => {
		setStatus("loading");
	}, [src]);
	return /* @__PURE__ */ jsxs("div", {
		className: cx("relative overflow-hidden bg-sand", ratio, wrapperClassName),
		children: [status === "loading" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 animate-pulse bg-gradient-to-br from-sand via-shell to-sand" }), status === "error" ? /* @__PURE__ */ jsxs("div", {
			className: "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sand text-muted",
			children: [/* @__PURE__ */ jsxs("svg", {
				"aria-hidden": "true",
				viewBox: "0 0 24 24",
				className: "h-7 w-7",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1",
				children: [/* @__PURE__ */ jsx("path", { d: "M4 5h16v14H4z" }), /* @__PURE__ */ jsx("path", { d: "M4 15l5-5 4 4 3-3 4 4" })]
			}), /* @__PURE__ */ jsx("span", {
				className: "text-[10px] uppercase tracking-[0.2em]",
				children: "Image unavailable"
			})]
		}) : /* @__PURE__ */ jsx("img", {
			src,
			alt,
			sizes,
			loading: priority ? "eager" : loading,
			fetchPriority: priority ? "high" : "auto",
			decoding: "async",
			onLoad: () => setStatus("loaded"),
			onError: () => setStatus("error"),
			className: cx("h-full w-full object-cover transition-opacity duration-700", status === "loaded" ? "opacity-100" : "opacity-0", className)
		})]
	});
}
//#endregion
//#region src/components/home/Hero.jsx
/**
* Editorial split hero. Text sits on cream, photography carries the season.
* On mobile the imagery stacks above the copy so nothing gets cropped badly.
*/
function Hero() {
	return /* @__PURE__ */ jsx("section", {
		className: "relative overflow-hidden border-b border-line",
		"aria-labelledby": "hero-heading",
		children: /* @__PURE__ */ jsx("div", {
			className: "shell",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "order-2 max-w-xl lg:order-1",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "eyebrow animate-fade-up",
							children: ["Autumn Collection ", (/* @__PURE__ */ new Date()).getFullYear()]
						}),
						/* @__PURE__ */ jsx("h1", {
							id: "hero-heading",
							className: "mt-5 animate-fade-up text-[3.1rem] leading-[0.98] sm:text-[4.2rem] lg:text-[5.2rem] xl:text-[5.8rem]",
							style: { animationDelay: "80ms" },
							children: store.tagline
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-6 max-w-md animate-fade-up text-base leading-relaxed text-slate",
							style: { animationDelay: "160ms" },
							children: [store.shortDescription, " Considered cuts, natural fabrics and a palette that works together season after season."]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-9 flex animate-fade-up flex-wrap items-center gap-3",
							style: { animationDelay: "240ms" },
							children: [/* @__PURE__ */ jsx(Button, {
								to: "/shop?gender=Women",
								size: "lg",
								children: "Shop Women"
							}), /* @__PURE__ */ jsx(Button, {
								to: "/shop?gender=Men",
								variant: "outline",
								size: "lg",
								children: "Shop Men"
							})]
						}),
						/* @__PURE__ */ jsx("dl", {
							className: "mt-12 grid max-w-md animate-fade-up grid-cols-3 gap-6 border-t border-line pt-7",
							style: { animationDelay: "320ms" },
							children: [
								{
									value: "120+",
									label: "Styles in store"
								},
								{
									value: "4.8",
									label: "Average rating"
								},
								{
									value: "15 day",
									label: "Easy returns"
								}
							].map((stat) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
								className: "font-display text-2xl text-ink sm:text-3xl",
								children: stat.value
							}), /* @__PURE__ */ jsx("dd", {
								className: "mt-1 text-[10px] uppercase tracking-[0.16em] text-muted",
								children: stat.label
							})] }, stat.label))
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "relative order-1 lg:order-2",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "animate-fade-in",
							children: /* @__PURE__ */ jsx(SmartImage, {
								src: buildImageUrl(PHOTOS.heroPortrait, {
									w: 1200,
									h: 1500
								}),
								alt: "Model wearing a powder blue longline trench coat from the VERA autumn collection",
								ratio: "aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]",
								priority: true,
								sizes: "(min-width: 1024px) 50vw, 100vw"
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "absolute -bottom-8 -left-8 hidden w-44 animate-fade-up border-4 border-cream xl:block",
							style: { animationDelay: "380ms" },
							children: /* @__PURE__ */ jsx(SmartImage, {
								src: buildImageUrl(PHOTOS.heroInset, {
									w: 500,
									h: 640
								}),
								alt: "Blush longline coat styled with black trousers",
								ratio: "aspect-[4/5]",
								sizes: "176px"
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "absolute right-4 top-4 animate-fade-up bg-cream/95 px-4 py-3 backdrop-blur-sm sm:right-6 sm:top-6",
							style: { animationDelay: "440ms" },
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[9px] uppercase tracking-[0.22em] text-muted",
								children: "The Outerwear Edit"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 font-display text-lg leading-none text-ink",
								children: "Now in store"
							})]
						})
					]
				})]
			})
		})
	});
}
//#endregion
//#region src/components/SectionHeading.jsx
/** Editorial section header with an optional right-aligned link. */
function SectionHeading({ eyebrow, title, titleId, subtitle, align = "left", linkTo, linkLabel, className }) {
	const centred = align === "center";
	return /* @__PURE__ */ jsxs("div", {
		className: cx("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", centred && "sm:flex-col sm:items-center sm:text-center", className),
		children: [/* @__PURE__ */ jsxs("div", {
			className: cx("max-w-xl", centred && "mx-auto text-center"),
			children: [
				eyebrow && /* @__PURE__ */ jsx("p", {
					className: "eyebrow mb-3",
					children: eyebrow
				}),
				/* @__PURE__ */ jsx("h2", {
					id: titleId,
					className: "text-[2rem] leading-[1.1] sm:text-[2.6rem] lg:text-[3rem]",
					children: title
				}),
				subtitle && /* @__PURE__ */ jsx("p", {
					className: "mt-3 max-w-md text-sm leading-relaxed text-slate sm:text-[0.95rem]",
					children: subtitle
				})
			]
		}), linkTo && linkLabel && /* @__PURE__ */ jsxs(Link, {
			to: linkTo,
			className: "group inline-flex shrink-0 items-center gap-2 text-[11px] font-normal uppercase tracking-[0.22em] text-ink transition-colors hover:text-clay",
			children: [/* @__PURE__ */ jsx("span", {
				className: "link-underline",
				children: linkLabel
			}), /* @__PURE__ */ jsx(ArrowRight, {
				size: 14,
				strokeWidth: 1.4,
				className: "transition-transform duration-300 group-hover:translate-x-1"
			})]
		})]
	});
}
//#endregion
//#region src/components/Reveal.jsx
/**
* Reveals children with a short fade-and-rise the first time they scroll
* into view. Falls back to visible immediately when IntersectionObserver
* is unavailable or motion is reduced.
*/
function Reveal({ children, delay = 0, className, as: Tag = "div" }) {
	const ref = useRef(null);
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const node = ref.current;
		const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		if (!node || reduceMotion || typeof IntersectionObserver === "undefined") {
			setVisible(true);
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.unobserve(entry.target);
				}
			});
		}, {
			threshold: .12,
			rootMargin: "0px 0px -8% 0px"
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	return /* @__PURE__ */ jsx(Tag, {
		ref,
		style: visible && delay ? { transitionDelay: `${delay}ms` } : void 0,
		className: cx("transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]", visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0", className),
		children
	});
}
//#endregion
//#region src/components/home/CategoryShowcase.jsx
var CATEGORY_CARDS = [
	{
		label: "Women",
		caption: "Dresses, ethnic wear and outerwear",
		to: "/shop?gender=Women",
		photo: PHOTOS.categoryWomen,
		alt: "Woman in a blush longline coat walking through an arcade"
	},
	{
		label: "Men",
		caption: "Shirts, denim and tailoring",
		to: "/shop?gender=Men",
		photo: PHOTOS.categoryMen,
		alt: "Man in a white linen blend shirt on a city street"
	},
	{
		label: "New Arrivals",
		caption: "Fresh off the studio rail",
		to: "/shop?tag=new",
		photo: PHOTOS.categoryNew,
		alt: "Rail of newly arrived garments in a boutique"
	},
	{
		label: "Accessories",
		caption: "Bags, belts and footwear",
		to: "/shop?category=Accessories",
		photo: PHOTOS.categoryAccessories,
		alt: "Flat lay of a leather handbag, sunglasses and watches"
	}
];
function CategoryShowcase() {
	return /* @__PURE__ */ jsxs("section", {
		className: "shell py-20 lg:py-28",
		"aria-labelledby": "category-heading",
		children: [/* @__PURE__ */ jsx(SectionHeading, {
			eyebrow: "Browse",
			title: "Shop by Category",
			titleId: "category-heading",
			subtitle: "Four ways into the collection, each edited down to the pieces worth owning.",
			linkTo: "/shop",
			linkLabel: "View everything"
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4",
			children: CATEGORY_CARDS.map((card, index) => /* @__PURE__ */ jsx(Reveal, {
				delay: index * 90,
				children: /* @__PURE__ */ jsxs(Link, {
					to: card.to,
					className: "group relative block overflow-hidden bg-ink",
					"aria-label": `Shop ${card.label}`,
					children: [
						/* @__PURE__ */ jsx(SmartImage, {
							src: buildImageUrl(card.photo, {
								w: 800,
								h: 1060
							}),
							alt: card.alt,
							ratio: "aspect-[3/4] lg:aspect-[4/5]",
							sizes: "(min-width: 1024px) 24vw, 46vw",
							className: "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
						}),
						/* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent transition-opacity duration-500 group-hover:from-ink/85" }),
						/* @__PURE__ */ jsxs("span", {
							className: "absolute inset-x-0 bottom-0 p-4 sm:p-5",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "block font-display text-xl text-cream sm:text-2xl",
									children: card.label
								}),
								/* @__PURE__ */ jsx("span", {
									className: "mt-1 hidden text-xs leading-relaxed text-cream/65 sm:block",
									children: card.caption
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-cream",
									children: ["Explore", /* @__PURE__ */ jsx(ArrowRight, {
										size: 13,
										strokeWidth: 1.5,
										className: "transition-transform duration-300 group-hover:translate-x-1.5"
									})]
								})
							]
						})
					]
				})
			}, card.label))
		})]
	});
}
//#endregion
//#region src/components/WishlistButton.jsx
/**
* Wishlist toggle. Two visual treatments:
*  - "floating" sits on top of a product image
*  - "inline" sits beside a call to action on the product page
*/
function WishlistButton({ product, variant = "floating", className, showLabel = false }) {
	const { isWishlisted, toggle } = useWishlist();
	const { toast } = useToast();
	const [pulse, setPulse] = useState(false);
	if (!product) return null;
	const active = isWishlisted(product.id);
	const handleClick = (event) => {
		event.preventDefault();
		event.stopPropagation();
		const added = toggle(product.id);
		setPulse(true);
		window.setTimeout(() => setPulse(false), 420);
		toast(added ? "Added to wishlist" : "Removed from wishlist", {
			tone: added ? "wishlist" : "info",
			description: product.name
		});
	};
	const shared = "inline-flex items-center justify-center transition-all duration-300";
	if (variant === "inline") return /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick: handleClick,
		"aria-pressed": active,
		"aria-label": active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`,
		className: cx(shared, "gap-2.5 border border-ink/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.22em] hover:border-ink", active ? "text-clay" : "text-ink", className),
		children: [/* @__PURE__ */ jsx(Heart, {
			size: 16,
			strokeWidth: 1.4,
			className: cx(active && "fill-clay text-clay", pulse && "animate-pop")
		}), showLabel && /* @__PURE__ */ jsx("span", { children: active ? "Wishlisted" : "Wishlist" })]
	});
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick: handleClick,
		"aria-pressed": active,
		"aria-label": active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`,
		className: cx(shared, "h-9 w-9 border border-ink/10 bg-cream/90 text-ink backdrop-blur-sm hover:bg-cream", className),
		children: /* @__PURE__ */ jsx(Heart, {
			size: 15,
			strokeWidth: 1.4,
			className: cx(active ? "fill-clay text-clay" : "text-ink", pulse && "animate-pop")
		})
	});
}
//#endregion
//#region src/components/Rating.jsx
/**
* Five point star rating. Half values are rendered with a clipped overlay so
* a 4.5 reads correctly rather than being rounded away.
*/
function Rating({ value = 0, size = 14, showValue = false, className }) {
	const rounded = Math.round(value * 2) / 2;
	return /* @__PURE__ */ jsxs("div", {
		className: cx("flex items-center gap-1.5", className),
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex items-center gap-0.5",
			role: "img",
			"aria-label": `Rated ${value} out of 5`,
			children: [
				1,
				2,
				3,
				4,
				5
			].map((index) => {
				const filled = rounded >= index;
				const half = !filled && rounded >= index - .5;
				return /* @__PURE__ */ jsxs("span", {
					className: "relative inline-flex",
					children: [/* @__PURE__ */ jsx(Star, {
						size,
						strokeWidth: 1.25,
						className: filled ? "fill-clay text-clay" : "fill-transparent text-ink/25"
					}), half && /* @__PURE__ */ jsx("span", {
						className: "absolute inset-0 overflow-hidden",
						style: { width: "50%" },
						children: /* @__PURE__ */ jsx(Star, {
							size,
							strokeWidth: 1.25,
							className: "fill-clay text-clay"
						})
					})]
				}, index);
			})
		}), showValue && /* @__PURE__ */ jsx("span", {
			className: "text-xs font-normal text-slate",
			children: value.toFixed(1)
		})]
	});
}
//#endregion
//#region src/components/ProductCard.jsx
/**
* Product tile used on the homepage, shop grid, wishlist and related rails.
* Hovering crossfades to the second gallery frame and reveals Quick Add,
* which opens an inline size picker so the shopper never leaves the grid.
*/
function ProductCard({ product, showRating = false, priority = false }) {
	const { addItem } = useCart();
	const { openCart } = useUI();
	const { toast } = useToast();
	const [picking, setPicking] = useState(false);
	if (!product) return null;
	const hoverImage = product.images[1] || product.images[0];
	const singleSize = !product.sizes || product.sizes.length <= 1;
	const commit = (size) => {
		addItem(product, {
			size,
			color: product.colors?.[0]?.name,
			quantity: 1
		});
		setPicking(false);
		toast("Added to bag", { description: `${product.name} - Size ${size}` });
		openCart();
	};
	const handleQuickAdd = () => {
		if (singleSize) {
			commit(product.sizes?.[0] || "One Size");
			return;
		}
		setPicking(true);
	};
	return /* @__PURE__ */ jsxs("article", {
		className: "group relative flex flex-col",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative overflow-hidden bg-sand",
			children: [
				/* @__PURE__ */ jsxs(Link, {
					to: `/product/${product.id}`,
					className: "block",
					"aria-label": `View ${product.name}`,
					tabIndex: picking ? -1 : 0,
					children: [/* @__PURE__ */ jsx(SmartImage, {
						src: product.images[0],
						alt: `${product.name} in ${product.colors?.[0]?.name || "signature"} - ${product.category}`,
						ratio: "aspect-[3/4]",
						priority,
						sizes: "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw",
						className: "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
					}), /* @__PURE__ */ jsx("img", {
						src: hoverImage,
						alt: "",
						"aria-hidden": "true",
						loading: "lazy",
						decoding: "async",
						className: "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5",
					children: [product.isNew && /* @__PURE__ */ jsx("span", {
						className: "bg-ink px-2.5 py-1 text-[9px] font-normal uppercase tracking-[0.2em] text-cream",
						children: "New"
					}), product.discount > 0 && /* @__PURE__ */ jsxs("span", {
						className: "bg-clay px-2.5 py-1 text-[9px] font-normal uppercase tracking-[0.2em] text-cream",
						children: [product.discount, "% Off"]
					})]
				}),
				/* @__PURE__ */ jsx(WishlistButton, {
					product,
					className: "absolute right-3 top-3"
				}),
				/* @__PURE__ */ jsx("div", {
					className: cx("absolute inset-x-3 bottom-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", "md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100", picking && "md:translate-y-0 md:opacity-100"),
					children: picking ? /* @__PURE__ */ jsxs("div", {
						className: "border border-ink/10 bg-cream/97 p-2.5 shadow-soft backdrop-blur-sm",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "mb-2 flex items-center justify-between px-0.5",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-[9px] uppercase tracking-[0.2em] text-muted",
								children: "Select size"
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => setPicking(false),
								"aria-label": "Cancel quick add",
								className: "text-muted transition-colors hover:text-ink",
								children: /* @__PURE__ */ jsx(X, {
									size: 13,
									strokeWidth: 1.6
								})
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "flex flex-wrap gap-1.5",
							children: product.sizes.map((size) => /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => commit(size),
								className: "min-w-9 border border-line bg-white px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream",
								children: size
							}, size))
						})]
					}) : /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: handleQuickAdd,
						className: "flex w-full items-center justify-center gap-2 bg-ink/92 px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-cream backdrop-blur-sm transition-colors duration-300 hover:bg-clay",
						children: [/* @__PURE__ */ jsx(Plus, {
							size: 13,
							strokeWidth: 1.6
						}), "Quick Add"]
					})
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-1 flex-col pt-4",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[10px] uppercase tracking-[0.2em] text-muted",
					children: product.category
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-1.5 font-sans text-[0.9rem] font-normal leading-snug text-ink",
					children: /* @__PURE__ */ jsx(Link, {
						to: `/product/${product.id}`,
						className: "link-underline",
						children: product.name
					})
				}),
				showRating && /* @__PURE__ */ jsx(Rating, {
					value: product.rating,
					className: "mt-2",
					size: 12,
					showValue: true
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-2 flex items-baseline gap-2.5",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-[0.9rem] tabular-nums text-ink",
						children: formatPrice(product.price)
					}), product.originalPrice && /* @__PURE__ */ jsx("span", {
						className: "text-xs tabular-nums text-muted line-through",
						children: formatPrice(product.originalPrice)
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/ProductGrid.jsx
var COLUMN_PRESETS = {
	four: "grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-7",
	three: "grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6",
	scrollRail: ""
};
/** Skeleton tile shown while a grid is loading. */
function SkeletonCard() {
	return /* @__PURE__ */ jsxs("div", {
		className: "animate-pulse",
		children: [
			/* @__PURE__ */ jsx("div", { className: "aspect-[3/4] w-full bg-sand" }),
			/* @__PURE__ */ jsx("div", { className: "mt-4 h-2.5 w-1/3 bg-sand" }),
			/* @__PURE__ */ jsx("div", { className: "mt-2.5 h-3 w-4/5 bg-sand" }),
			/* @__PURE__ */ jsx("div", { className: "mt-2.5 h-3 w-1/4 bg-sand" })
		]
	});
}
function ProductGrid({ products = [], columns = "four", loading = false, skeletonCount = 8, showRating = false, animate = true, prioritiseFirst = 0, className }) {
	const gridClass = cx("grid", COLUMN_PRESETS[columns] || COLUMN_PRESETS.four, className);
	if (loading) return /* @__PURE__ */ jsx("div", {
		className: gridClass,
		children: Array.from({ length: skeletonCount }, (_, index) => /* @__PURE__ */ jsx(SkeletonCard, {}, index))
	});
	return /* @__PURE__ */ jsx("div", {
		className: gridClass,
		children: products.map((product, index) => animate ? /* @__PURE__ */ jsx(Reveal, {
			delay: Math.min(index, 5) * 70,
			as: "div",
			children: /* @__PURE__ */ jsx(ProductCard, {
				product,
				showRating,
				priority: index < prioritiseFirst
			})
		}, product.id) : /* @__PURE__ */ jsx(ProductCard, {
			product,
			showRating,
			priority: index < prioritiseFirst
		}, product.id))
	});
}
//#endregion
//#region src/components/home/NewArrivals.jsx
function NewArrivals() {
	const items = newArrivals.slice(0, 8);
	return /* @__PURE__ */ jsxs("section", {
		className: "shell pb-20 lg:pb-28",
		"aria-labelledby": "new-arrivals-heading",
		children: [/* @__PURE__ */ jsx(SectionHeading, {
			eyebrow: "Just In",
			title: "New Arrivals",
			titleId: "new-arrivals-heading",
			subtitle: "Fresh styles, just for you.",
			linkTo: "/shop?tag=new",
			linkLabel: "See all new",
			className: "mb-12"
		}), /* @__PURE__ */ jsx(ProductGrid, {
			products: items,
			columns: "four"
		})]
	});
}
//#endregion
//#region src/components/home/PromoBanner.jsx
/** Seasonal sale banner. Full-bleed photography with a dark scrim for contrast. */
function PromoBanner() {
	return /* @__PURE__ */ jsxs("section", {
		"aria-labelledby": "promo-heading",
		className: "relative overflow-hidden bg-ink",
		children: [
			/* @__PURE__ */ jsx("img", {
				src: buildImageUrl(PHOTOS.promoWide, {
					w: 1900,
					h: 900,
					crop: "entropy"
				}),
				alt: "Shopper carrying VERA bags along a city street during the seasonal sale",
				loading: "lazy",
				decoding: "async",
				className: "absolute inset-0 h-full w-full object-cover object-center opacity-70"
			}),
			/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/25" }),
			/* @__PURE__ */ jsx("div", {
				className: "shell relative py-24 lg:py-36",
				children: /* @__PURE__ */ jsxs(Reveal, {
					className: "max-w-lg",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[10px] uppercase tracking-[0.28em] text-cream/60",
							children: "Season Sale"
						}),
						/* @__PURE__ */ jsx("h2", {
							id: "promo-heading",
							className: "mt-5 text-[2.8rem] leading-[0.95] text-cream sm:text-[4rem] lg:text-[4.8rem]",
							children: "Up to 40% Off"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-5 max-w-sm text-sm leading-relaxed text-cream/70 sm:text-base",
							children: "Seasonal styles made for you. Selected dresses, shirts, denim and outerwear reduced while stock lasts."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-9 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ jsx(Button, {
								to: "/shop?tag=sale",
								variant: "light",
								size: "lg",
								children: "Shop Sale"
							}), /* @__PURE__ */ jsx(Button, {
								to: "/shop",
								variant: "ghostLight",
								size: "lg",
								children: "Full Collection"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/components/home/FeaturedCollection.jsx
var POINTS = [
	"Natural fibres chosen for Indian weather",
	"Colours designed to layer with each other",
	"Cuts refined across three fittings"
];
/** Editorial split section: image on one side, brand story on the other. */
function FeaturedCollection() {
	return /* @__PURE__ */ jsx("section", {
		className: "shell py-20 lg:py-28",
		"aria-labelledby": "featured-heading",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
			children: [/* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsx(SmartImage, {
				src: buildImageUrl(PHOTOS.featuredWide, {
					w: 1200,
					h: 1400,
					crop: "entropy"
				}),
				alt: "Neutral wardrobe of everyday essentials hanging on a rail",
				ratio: "aspect-[4/5] lg:aspect-[5/6]",
				sizes: "(min-width: 1024px) 48vw, 100vw"
			}) }), /* @__PURE__ */ jsxs(Reveal, {
				delay: 120,
				className: "lg:pl-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "eyebrow",
						children: "The Edit"
					}),
					/* @__PURE__ */ jsx("h2", {
						id: "featured-heading",
						className: "mt-4 text-[2.3rem] leading-[1.05] sm:text-[3rem] lg:text-[3.4rem]",
						children: "Everyday Essentials"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 max-w-md text-base leading-relaxed text-slate",
						children: "Timeless pieces designed to move with you. A small, deliberate wardrobe of shirts, tees, denim and knitwear that we remake every season rather than reinvent."
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-8 space-y-3.5",
						children: POINTS.map((point) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-start gap-3 text-sm text-slate",
							children: [/* @__PURE__ */ jsx("span", {
								className: "mt-2 h-1 w-1 shrink-0 rounded-full bg-clay",
								"aria-hidden": "true"
							}), point]
						}, point))
					}),
					/* @__PURE__ */ jsx(Button, {
						to: "/shop?category=T-Shirts",
						className: "mt-9",
						size: "lg",
						children: "Explore Collection"
					})
				]
			})]
		})
	});
}
//#endregion
//#region src/components/home/BestSellers.jsx
function BestSellers() {
	const items = bestSellers.slice(0, 4);
	return /* @__PURE__ */ jsxs("section", {
		className: "shell py-20 lg:py-28",
		"aria-labelledby": "best-sellers-heading",
		children: [/* @__PURE__ */ jsx(SectionHeading, {
			eyebrow: "Most Loved",
			title: "Best Sellers",
			titleId: "best-sellers-heading",
			subtitle: "The pieces our customers keep coming back for.",
			linkTo: "/shop?tag=bestseller",
			linkLabel: "Shop best sellers",
			className: "mb-12"
		}), /* @__PURE__ */ jsx(ProductGrid, {
			products: items,
			columns: "four",
			showRating: true
		})]
	});
}
//#endregion
//#region src/components/home/ValueProps.jsx
var VALUES = [
	{
		Icon: Gem,
		title: "Premium Quality",
		body: "Mill-sourced fabrics, reinforced seams and a three-stage quality check before anything ships."
	},
	{
		Icon: Scissors,
		title: "Curated Styles",
		body: "Small, considered collections. We would rather stock fifty pieces properly than five hundred badly."
	},
	{
		Icon: ShoppingBag,
		title: "Easy Shopping",
		body: `Straightforward sizing, honest photography and ${store.returnWindowDays} day returns with free pickup.`
	},
	{
		Icon: Truck,
		title: "Fast Delivery",
		body: "Dispatched the same working day, with free delivery across India on larger orders."
	}
];
function ValueProps() {
	return /* @__PURE__ */ jsx("section", {
		className: "border-y border-line bg-sand/50",
		"aria-labelledby": "values-heading",
		children: /* @__PURE__ */ jsxs("div", {
			className: "shell py-16 lg:py-20",
			children: [
				/* @__PURE__ */ jsxs("h2", {
					id: "values-heading",
					className: "sr-only",
					children: ["Why shop with ", store.storeNamePlain]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "eyebrow mb-10 text-center",
					children: ["Why ", store.storeName]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4",
					children: VALUES.map(({ Icon, title, body }, index) => /* @__PURE__ */ jsxs(Reveal, {
						delay: index * 80,
						className: "text-center sm:text-left",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "inline-flex text-clay",
								children: /* @__PURE__ */ jsx(Icon, {
									size: 24,
									strokeWidth: 1.1
								})
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-4 font-sans text-[11px] font-normal uppercase tracking-[0.2em] text-ink",
								children: title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm leading-relaxed text-slate",
								children: body
							})
						]
					}, title))
				})
			]
		})
	});
}
//#endregion
//#region src/data/reviews.js
/**
* Demo customer reviews. A shared pool is mapped deterministically onto each
* product so every product page shows consistent, realistic feedback without
* hand-writing hundreds of entries. All names are fictional.
*/
var POOL = [
	{
		name: "Aditi Raghavan",
		rating: 5,
		date: "12 August 2026",
		title: "Better than expected",
		body: "The fabric feels genuinely premium and the stitching is clean throughout. I sized as recommended and the fit was spot on."
	},
	{
		name: "Karthik Menon",
		rating: 5,
		date: "4 August 2026",
		title: "Worth every rupee",
		body: "I was unsure about ordering online but the finish is closer to a boutique piece than anything I have bought at this price."
	},
	{
		name: "Sneha Kulkarni",
		rating: 4,
		date: "29 July 2026",
		title: "Lovely piece, runs slightly large",
		body: "Beautiful colour in daylight and very comfortable. I would suggest going one size down if you prefer a closer fit."
	},
	{
		name: "Rohan Deshpande",
		rating: 5,
		date: "21 July 2026",
		title: "Holds up after washing",
		body: "Third wash and there is no fading or shrinking. The colour is exactly as photographed, which is rare."
	},
	{
		name: "Meera Iyer",
		rating: 5,
		date: "15 July 2026",
		title: "Got compliments all evening",
		body: "Wore it to a family function and three people asked where it was from. Packaging was lovely too."
	},
	{
		name: "Farhan Qureshi",
		rating: 4,
		date: "8 July 2026",
		title: "Great quality, quick delivery",
		body: "Arrived in three days in Chennai. Material is breathable which matters here. Only wish there were more colours."
	},
	{
		name: "Divya Nair",
		rating: 5,
		date: "30 June 2026",
		title: "Exactly as described",
		body: "The product page measurements were accurate, so there was no guesswork. Will be ordering the other colour."
	},
	{
		name: "Aryan Kapoor",
		rating: 4,
		date: "22 June 2026",
		title: "Comfortable for long days",
		body: "Wore it through a twelve hour work day with no discomfort. Feels well constructed rather than mass produced."
	},
	{
		name: "Ishita Bansal",
		rating: 5,
		date: "14 June 2026",
		title: "My third order from VERA",
		body: "Consistent quality every single time. The team also helped me exchange a size over WhatsApp within a day."
	}
];
/** Simple stable hash so the same product always gets the same reviews. */
function hash(value) {
	let total = 0;
	for (let i = 0; i < value.length; i += 1) total += value.charCodeAt(i);
	return total;
}
function reviewsFor(product, count = 3) {
	if (!product) return [];
	const start = hash(product.id) % POOL.length;
	return Array.from({ length: count }, (_, i) => POOL[(start + i * 2) % POOL.length]);
}
/** Homepage testimonials. */
var testimonials = [
	{
		name: "Ananya Sharma",
		location: "Bengaluru",
		rating: 5,
		quote: "Absolutely loved the quality and fit. The collection feels premium without being overpriced, and the pieces work together effortlessly."
	},
	{
		name: "Vikram Shetty",
		location: "Mumbai",
		rating: 5,
		quote: "I ordered two shirts and a blazer. The tailoring is sharp, the fabric breathes, and everything arrived pressed and beautifully packed."
	},
	{
		name: "Priyanka Reddy",
		location: "Hyderabad",
		rating: 5,
		quote: "The saree I bought for my sister was stunning in person. Their team answered every question on WhatsApp before I ordered."
	},
	{
		name: "Nikhil Joshi",
		location: "Pune",
		rating: 4,
		quote: "Clean, quiet design and no gimmicks. Delivery was quick and the return policy gave me the confidence to try a new size."
	}
];
//#endregion
//#region src/components/home/Testimonials.jsx
function Testimonials() {
	return /* @__PURE__ */ jsxs("section", {
		className: "shell py-20 lg:py-28",
		"aria-labelledby": "reviews-heading",
		children: [/* @__PURE__ */ jsx(SectionHeading, {
			eyebrow: "Customer Love",
			title: "What our customers say",
			titleId: "reviews-heading",
			subtitle: "Verified reviews from shoppers across India.",
			align: "center"
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
			children: testimonials.map((testimonial, index) => /* @__PURE__ */ jsx(Reveal, {
				delay: index * 80,
				children: /* @__PURE__ */ jsxs("figure", {
					className: "flex h-full flex-col border border-line bg-white p-6",
					children: [
						/* @__PURE__ */ jsx(Rating, {
							value: testimonial.rating,
							size: 13
						}),
						/* @__PURE__ */ jsx("blockquote", {
							className: "mt-4 flex-1 font-display text-lg leading-snug text-ink",
							children: testimonial.quote
						}),
						/* @__PURE__ */ jsxs("figcaption", {
							className: "mt-6 border-t border-line pt-4",
							children: [/* @__PURE__ */ jsx("span", {
								className: "block text-[11px] uppercase tracking-[0.18em] text-ink",
								children: testimonial.name
							}), /* @__PURE__ */ jsx("span", {
								className: "mt-1 block text-xs text-muted",
								children: testimonial.location
							})]
						})
					]
				})
			}, testimonial.name))
		})]
	});
}
//#endregion
//#region src/components/home/InstagramGrid.jsx
var CAPTIONS = [
	"Sunlit accessories from the summer edit",
	"Pastel knitwear on the studio rail",
	"The printed dress rail in our Chennai store",
	"Neutral layering for transitional weather",
	"Colour blocking with our shirting range",
	"Streetwear styling from the weekend drop"
];
function InstagramGrid() {
	return /* @__PURE__ */ jsx("section", {
		className: "border-t border-line bg-sand/40",
		"aria-labelledby": "social-heading",
		children: /* @__PURE__ */ jsxs("div", {
			className: "shell py-20 lg:py-24",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "text-center",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "eyebrow",
						children: "Follow along"
					}),
					/* @__PURE__ */ jsxs("h2", {
						id: "social-heading",
						className: "mt-4 text-[2rem] sm:text-[2.6rem]",
						children: ["Follow ", store.instagramHandle]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: store.instagram,
						target: "_blank",
						rel: "noreferrer noopener",
						className: "group mt-5 inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-ink transition-colors hover:text-clay",
						children: [
							/* @__PURE__ */ jsx(InstagramIcon, { size: 16 }),
							/* @__PURE__ */ jsx("span", {
								className: "link-underline",
								children: "Tag us to be featured"
							}),
							/* @__PURE__ */ jsx(ArrowUpRight, {
								size: 13,
								strokeWidth: 1.5,
								className: "transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
							})
						]
					})
				]
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6",
				children: PHOTOS.social.map((photo, index) => /* @__PURE__ */ jsx(Reveal, {
					delay: index * 60,
					children: /* @__PURE__ */ jsxs("a", {
						href: store.instagram,
						target: "_blank",
						rel: "noreferrer noopener",
						className: "group relative block overflow-hidden bg-shell",
						"aria-label": `${CAPTIONS[index]} - open Instagram`,
						children: [/* @__PURE__ */ jsx("img", {
							src: buildImageUrl(photo, {
								w: 520,
								h: 520,
								crop: "entropy"
							}),
							alt: CAPTIONS[index],
							loading: "lazy",
							decoding: "async",
							className: "aspect-square h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
						}), /* @__PURE__ */ jsx("span", {
							className: "absolute inset-0 flex items-center justify-center bg-ink/0 text-cream opacity-0 transition-all duration-300 group-hover:bg-ink/35 group-hover:opacity-100",
							children: /* @__PURE__ */ jsx(InstagramIcon, { size: 22 })
						})]
					})
				}, photo))
			})]
		})
	});
}
//#endregion
//#region src/pages/Home.jsx
function Home() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Premium Fashion",
			description: "VERA is a premium fashion label with curated dresses, shirts, denim, jackets and accessories for women and men. Style That Speaks."
		}),
		/* @__PURE__ */ jsx(Hero, {}),
		/* @__PURE__ */ jsx(CategoryShowcase, {}),
		/* @__PURE__ */ jsx(NewArrivals, {}),
		/* @__PURE__ */ jsx(PromoBanner, {}),
		/* @__PURE__ */ jsx(FeaturedCollection, {}),
		/* @__PURE__ */ jsx(BestSellers, {}),
		/* @__PURE__ */ jsx(ValueProps, {}),
		/* @__PURE__ */ jsx(Testimonials, {}),
		/* @__PURE__ */ jsx(InstagramGrid, {})
	] });
}
//#endregion
//#region src/components/Breadcrumbs.jsx
/** `items` is an array of { label, to } - the last entry renders as text. */
function Breadcrumbs({ items = [] }) {
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": "Breadcrumb",
		children: /* @__PURE__ */ jsx("ol", {
			className: "flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted",
			children: items.map((item, index) => {
				const isLast = index === items.length - 1;
				return /* @__PURE__ */ jsxs("li", {
					className: "flex items-center gap-1.5",
					children: [isLast || !item.to ? /* @__PURE__ */ jsx("span", {
						className: isLast ? "text-ink" : void 0,
						children: item.label
					}) : /* @__PURE__ */ jsx(Link, {
						to: item.to,
						className: "transition-colors hover:text-ink",
						children: item.label
					}), !isLast && /* @__PURE__ */ jsx(ChevronRight, {
						size: 11,
						strokeWidth: 1.5,
						className: "text-muted/60"
					})]
				}, `${item.label}-${index}`);
			})
		})
	});
}
//#endregion
//#region src/utils/catalogue.js
/** Filtering, sorting and searching helpers for the catalogue. */
var PRICE_BANDS = [
	{
		id: "under-1500",
		label: "Under 1,500",
		min: 0,
		max: 1499
	},
	{
		id: "1500-3000",
		label: "1,500 - 3,000",
		min: 1500,
		max: 3e3
	},
	{
		id: "3000-5000",
		label: "3,000 - 5,000",
		min: 3001,
		max: 5e3
	},
	{
		id: "above-5000",
		label: "5,000 and above",
		min: 5001,
		max: Infinity
	}
];
/** Number of filters the shopper has actively applied. */
function countActiveFilters(filters) {
	return filters.categories.length + filters.genders.length + filters.sizes.length + filters.priceBands.length + (filters.onSale ? 1 : 0) + (filters.q ? 1 : 0) + (filters.tag ? 1 : 0);
}
function matchesPrice(product, bandIds) {
	if (bandIds.length === 0) return true;
	return bandIds.some((id) => {
		const band = PRICE_BANDS.find((b) => b.id === id);
		if (!band) return false;
		return product.price >= band.min && product.price <= band.max;
	});
}
function matchesTag(product, tag) {
	switch (tag) {
		case "new": return product.isNew;
		case "bestseller": return product.isBestSeller;
		case "sale": return product.isSale;
		default: return true;
	}
}
function filterProducts(products, filters) {
	const query = filters.q.trim().toLowerCase();
	return products.filter((product) => {
		if (query && !product.searchIndex.includes(query)) return false;
		if (filters.categories.length && !filters.categories.includes(product.category)) return false;
		if (filters.genders.length && !filters.genders.includes(product.gender)) return false;
		if (filters.sizes.length && !filters.sizes.some((size) => product.sizes.includes(size))) return false;
		if (filters.onSale && !product.isSale) return false;
		if (!matchesPrice(product, filters.priceBands)) return false;
		if (filters.tag && !matchesTag(product, filters.tag)) return false;
		return true;
	});
}
function sortProducts(list, sort) {
	const sorted = [...list];
	switch (sort) {
		case "price-asc": return sorted.sort((a, b) => a.price - b.price);
		case "price-desc": return sorted.sort((a, b) => b.price - a.price);
		case "rating": return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
		case "discount": return sorted.sort((a, b) => b.discount - a.discount);
		case "new": return sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.rating - a.rating);
		default: return sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || Number(b.isNew) - Number(a.isNew) || b.reviewCount - a.reviewCount);
	}
}
//#endregion
//#region src/components/ProductFilters.jsx
function Group({ title, children }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "border-b border-line py-6 first:pt-0",
		children: [/* @__PURE__ */ jsx("h3", {
			className: "mb-4 text-[10px] font-normal uppercase tracking-[0.24em] text-ink",
			children: title
		}), children]
	});
}
function CheckRow({ label, checked, onChange, count }) {
	return /* @__PURE__ */ jsxs("label", {
		className: "group flex cursor-pointer items-center gap-3 py-1.5 text-sm text-slate transition-colors hover:text-ink",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: cx("flex h-4 w-4 shrink-0 items-center justify-center border transition-colors", checked ? "border-ink bg-ink text-cream" : "border-line bg-white group-hover:border-ink/50"),
				children: checked && /* @__PURE__ */ jsx(Check, {
					size: 11,
					strokeWidth: 2.2
				})
			}),
			/* @__PURE__ */ jsx("input", {
				type: "checkbox",
				className: "sr-only",
				checked,
				onChange
			}),
			/* @__PURE__ */ jsx("span", {
				className: "flex-1",
				children: label
			}),
			typeof count === "number" && /* @__PURE__ */ jsx("span", {
				className: "text-xs tabular-nums text-muted",
				children: count
			})
		]
	});
}
function SizePill({ size, active, onClick }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: cx("min-w-11 border px-2.5 py-2 text-[11px] uppercase tracking-[0.1em] transition-colors", active ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-ink/50"),
		children: size
	});
}
/**
* Filter panel. Rendered inline as a sidebar on desktop and inside a drawer
* on smaller screens - the markup is identical in both cases.
*/
function ProductFilters({ filters, onChange, onClear, counts = {} }) {
	const activeCount = countActiveFilters(filters);
	const toggleArrayValue = (key, value) => {
		const list = filters[key];
		onChange({
			...filters,
			[key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
		});
	};
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between border-b border-line pb-4",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-[10px] uppercase tracking-[0.24em] text-muted",
				children: activeCount > 0 ? `${activeCount} applied` : "Refine"
			}), activeCount > 0 && /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: onClear,
				className: "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:text-clay",
				children: [/* @__PURE__ */ jsx(X, {
					size: 12,
					strokeWidth: 1.6
				}), "Clear all"]
			})]
		}),
		/* @__PURE__ */ jsx(Group, {
			title: "Category",
			children: /* @__PURE__ */ jsx("div", {
				className: "-mt-1",
				children: CATEGORIES.map((category) => /* @__PURE__ */ jsx(CheckRow, {
					label: category,
					count: counts.categories?.[category],
					checked: filters.categories.includes(category),
					onChange: () => toggleArrayValue("categories", category)
				}, category))
			})
		}),
		/* @__PURE__ */ jsx(Group, {
			title: "Shop for",
			children: /* @__PURE__ */ jsx("div", {
				className: "-mt-1",
				children: GENDERS.map((gender) => /* @__PURE__ */ jsx(CheckRow, {
					label: gender,
					count: counts.genders?.[gender],
					checked: filters.genders.includes(gender),
					onChange: () => toggleArrayValue("genders", gender)
				}, gender))
			})
		}),
		/* @__PURE__ */ jsx(Group, {
			title: "Size",
			children: /* @__PURE__ */ jsx("div", {
				className: "space-y-4",
				children: SIZE_GROUPS.map((group) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "mb-2 text-[10px] uppercase tracking-[0.16em] text-muted",
					children: group.label
				}), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-1.5",
					children: group.sizes.map((size) => /* @__PURE__ */ jsx(SizePill, {
						size,
						active: filters.sizes.includes(size),
						onClick: () => toggleArrayValue("sizes", size)
					}, size))
				})] }, group.label))
			})
		}),
		/* @__PURE__ */ jsx(Group, {
			title: "Price",
			children: /* @__PURE__ */ jsx("div", {
				className: "-mt-1",
				children: PRICE_BANDS.map((band) => /* @__PURE__ */ jsx(CheckRow, {
					label: band.label,
					checked: filters.priceBands.includes(band.id),
					onChange: () => toggleArrayValue("priceBands", band.id)
				}, band.id))
			})
		}),
		/* @__PURE__ */ jsx(Group, {
			title: "Offers",
			children: /* @__PURE__ */ jsx(CheckRow, {
				label: "On sale only",
				checked: filters.onSale,
				onChange: () => onChange({
					...filters,
					onSale: !filters.onSale
				})
			})
		})
	] });
}
//#endregion
//#region src/components/Drawer.jsx
/** Side sheet used for the bag and for the mobile filter panel. */
function Drawer({ open, onClose, title, side = "right", children, footer, widthClass = "max-w-[26rem]" }) {
	const panelRef = useRef(null);
	const previouslyFocused = useRef(null);
	useScrollLock(open);
	useEffect(() => {
		if (!open) return void 0;
		previouslyFocused.current = document.activeElement;
		const timer = window.setTimeout(() => panelRef.current?.focus(), 20);
		const onKeyDown = (event) => {
			if (event.key === "Escape") onClose?.();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("keydown", onKeyDown);
			if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus();
		};
	}, [open, onClose]);
	if (!open) return null;
	return createPortal(/* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-[95]",
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": "Close panel",
			onClick: onClose,
			className: "absolute inset-0 animate-fade-in cursor-default bg-ink/40 backdrop-blur-[2px]"
		}), /* @__PURE__ */ jsxs("aside", {
			ref: panelRef,
			tabIndex: -1,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: cx("absolute inset-y-0 flex w-full flex-col bg-cream shadow-[0_24px_60px_-28px_rgb(22_19_15/0.28)] outline-none", widthClass, side === "right" ? "right-0 animate-slide-in-right" : "left-0 animate-slide-in-left"),
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "flex shrink-0 items-center justify-between border-b border-line px-5 py-5 sm:px-6",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-[11px] font-normal uppercase tracking-[0.28em] text-ink",
						children: title
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onClose,
						"aria-label": "Close panel",
						className: "flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-clay",
						children: /* @__PURE__ */ jsx(X, {
							size: 18,
							strokeWidth: 1.4
						})
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "min-h-0 flex-1 overflow-y-auto",
					children
				}),
				footer && /* @__PURE__ */ jsx("div", {
					className: "shrink-0 border-t border-line bg-sand/60",
					children: footer
				})
			]
		})]
	}), document.body);
}
//#endregion
//#region src/components/EmptyState.jsx
/** Shared empty state layout for the bag, wishlist and no-results views. */
function EmptyState({ icon: Icon, title, description, children, className }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cx("flex flex-col items-center px-6 py-20 text-center", className),
		children: [
			Icon && /* @__PURE__ */ jsx("span", {
				className: "mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-sand text-ink/70",
				children: /* @__PURE__ */ jsx(Icon, {
					size: 22,
					strokeWidth: 1.2
				})
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "text-2xl sm:text-[1.9rem]",
				children: title
			}),
			description && /* @__PURE__ */ jsx("p", {
				className: "mt-3 max-w-sm text-sm leading-relaxed text-slate",
				children: description
			}),
			children && /* @__PURE__ */ jsx("div", {
				className: "mt-8 flex flex-wrap items-center justify-center gap-3",
				children
			})
		]
	});
}
//#endregion
//#region src/pages/Shop.jsx
var PAGE_SIZE = 12;
var TAG_LABELS = {
	new: "New Arrivals",
	bestseller: "Best Sellers",
	sale: "On Sale"
};
var splitParam = (value) => value ? value.split(",").filter(Boolean) : [];
function Shop() {
	const [params, setParams] = useSearchParams();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [booting, setBooting] = useState(true);
	const filters = useMemo(() => ({
		q: params.get("q") || "",
		categories: splitParam(params.get("category")),
		genders: splitParam(params.get("gender")),
		sizes: splitParam(params.get("size")),
		priceBands: splitParam(params.get("price")),
		onSale: params.get("sale") === "1",
		tag: params.get("tag") || ""
	}), [params]);
	const sort = params.get("sort") || "featured";
	const paramKey = params.toString();
	useEffect(() => {
		const timer = window.setTimeout(() => setBooting(false), 260);
		return () => window.clearTimeout(timer);
	}, []);
	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
	}, [paramKey]);
	const writeFilters = (next, nextSort = sort) => {
		const search = new URLSearchParams();
		if (next.q) search.set("q", next.q);
		if (next.categories.length) search.set("category", next.categories.join(","));
		if (next.genders.length) search.set("gender", next.genders.join(","));
		if (next.sizes.length) search.set("size", next.sizes.join(","));
		if (next.priceBands.length) search.set("price", next.priceBands.join(","));
		if (next.onSale) search.set("sale", "1");
		if (next.tag) search.set("tag", next.tag);
		if (nextSort && nextSort !== "featured") search.set("sort", nextSort);
		setParams(search, { replace: true });
	};
	const clearAll = () => writeFilters({
		q: "",
		categories: [],
		genders: [],
		sizes: [],
		priceBands: [],
		onSale: false,
		tag: ""
	});
	const results = useMemo(() => sortProducts(filterProducts(products, filters), sort), [filters, sort]);
	const counts = useMemo(() => {
		const categories = {};
		CATEGORIES.forEach((category) => {
			categories[category] = filterProducts(products, {
				...filters,
				categories: [category]
			}).length;
		});
		const genders = {};
		GENDERS.forEach((gender) => {
			genders[gender] = filterProducts(products, {
				...filters,
				genders: [gender]
			}).length;
		});
		return {
			categories,
			genders
		};
	}, [filters]);
	const activeCount = countActiveFilters(filters);
	const visible = results.slice(0, visibleCount);
	const hasMore = visibleCount < results.length;
	const chips = [
		...filters.q ? [{
			label: `"${filters.q}"`,
			remove: () => writeFilters({
				...filters,
				q: ""
			})
		}] : [],
		...filters.tag ? [{
			label: TAG_LABELS[filters.tag] || filters.tag,
			remove: () => writeFilters({
				...filters,
				tag: ""
			})
		}] : [],
		...filters.genders.map((gender) => ({
			label: gender,
			remove: () => writeFilters({
				...filters,
				genders: filters.genders.filter((g) => g !== gender)
			})
		})),
		...filters.categories.map((category) => ({
			label: category,
			remove: () => writeFilters({
				...filters,
				categories: filters.categories.filter((c) => c !== category)
			})
		})),
		...filters.sizes.map((size) => ({
			label: `Size ${size}`,
			remove: () => writeFilters({
				...filters,
				sizes: filters.sizes.filter((s) => s !== size)
			})
		})),
		...filters.priceBands.map((id) => ({
			label: PRICE_BANDS.find((band) => band.id === id)?.label || id,
			remove: () => writeFilters({
				...filters,
				priceBands: filters.priceBands.filter((b) => b !== id)
			})
		})),
		...filters.onSale ? [{
			label: "On sale",
			remove: () => writeFilters({
				...filters,
				onSale: false
			})
		}] : []
	];
	const heading = (() => {
		if (filters.q) return `Results for "${filters.q}"`;
		if (filters.tag) return TAG_LABELS[filters.tag] || "Shop";
		if (filters.genders.length === 1 && filters.categories.length === 0) return `${filters.genders[0]}'s Collection`;
		if (filters.categories.length === 1) return filters.categories[0];
		return "All Collections";
	})();
	const metaTitle = (() => {
		if (filters.genders.length === 1) return `Shop ${filters.genders[0]}'s Fashion`;
		if (filters.tag === "new") return "New Arrivals";
		if (filters.tag === "sale") return "Sale";
		return "Shop All";
	})();
	const filterPanel = /* @__PURE__ */ jsx(ProductFilters, {
		filters,
		onChange: (next) => writeFilters(next),
		onClear: clearAll,
		counts
	});
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: metaTitle,
			description: `Browse ${products.length} curated pieces from VERA. Filter by category, size, price and offers, with easy 15 day returns across India.`
		}),
		/* @__PURE__ */ jsx("div", {
			className: "border-b border-line bg-sand/40",
			children: /* @__PURE__ */ jsxs("div", {
				className: "shell py-10 lg:py-14",
				children: [
					/* @__PURE__ */ jsx(Breadcrumbs, { items: [{
						label: "Home",
						to: "/"
					}, { label: "Shop" }] }),
					/* @__PURE__ */ jsx("h1", {
						className: "mt-5 text-[2.4rem] leading-none sm:text-[3.2rem]",
						children: heading
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-3 text-sm text-slate",
						children: [
							pluralise(results.length, "piece"),
							" available",
							filters.genders.length === 0 && filters.categories.length === 0 && !filters.tag ? " across women, men and accessories" : ""
						]
					})
				]
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell py-10 lg:py-14",
			children: /* @__PURE__ */ jsxs("div", {
				className: "lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12 xl:grid-cols-[17rem_1fr]",
				children: [/* @__PURE__ */ jsx("aside", {
					className: "hidden lg:block",
					children: /* @__PURE__ */ jsx("div", {
						className: "sticky top-28",
						children: filterPanel
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-3 border-b border-line pb-4",
							children: [
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => setDrawerOpen(true),
									className: "inline-flex items-center gap-2.5 border border-ink/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-ink lg:hidden",
									children: [
										/* @__PURE__ */ jsx(Funnel, {
											size: 14,
											strokeWidth: 1.5
										}),
										"Filters",
										activeCount > 0 && /* @__PURE__ */ jsx("span", {
											className: "flex h-4 min-w-4 items-center justify-center bg-clay px-1 text-[9px] text-cream",
											children: activeCount
										})
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "hidden text-xs text-muted lg:block",
									children: [
										"Showing ",
										visible.length,
										" of ",
										results.length
									]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "flex items-center gap-2.5 text-[10px] uppercase tracking-[0.18em] text-muted",
									children: [/* @__PURE__ */ jsx("span", {
										className: "hidden sm:inline",
										children: "Sort"
									}), /* @__PURE__ */ jsx("select", {
										value: sort,
										onChange: (event) => writeFilters(filters, event.target.value),
										className: "border border-line bg-white px-3 py-2.5 text-[11px] normal-case tracking-normal text-ink outline-none transition-colors hover:border-ink/50 focus:border-ink",
										"aria-label": "Sort products",
										children: SORT_OPTIONS.map((option) => /* @__PURE__ */ jsx("option", {
											value: option.value,
											children: option.label
										}, option.value))
									})]
								})
							]
						}),
						chips.length > 0 && /* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex flex-wrap items-center gap-2",
							children: [chips.map((chip) => /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: chip.remove,
								className: "group inline-flex items-center gap-2 border border-line bg-white px-3 py-1.5 text-xs text-slate transition-colors hover:border-ink hover:text-ink",
								children: [chip.label, /* @__PURE__ */ jsx(X, {
									size: 12,
									strokeWidth: 1.7,
									className: "text-muted group-hover:text-ink"
								})]
							}, chip.label)), /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: clearAll,
								className: "ml-1 text-[10px] uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline",
								children: "Clear all"
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-8",
							children: booting ? /* @__PURE__ */ jsx(ProductGrid, {
								loading: true,
								skeletonCount: 8
							}) : results.length === 0 ? /* @__PURE__ */ jsxs(EmptyState, {
								icon: Funnel,
								title: "No styles found.",
								description: "Nothing matches this combination yet. Try removing a filter or two, or browse the full collection.",
								children: [/* @__PURE__ */ jsx(Button, {
									onClick: clearAll,
									children: "Clear filters"
								}), /* @__PURE__ */ jsx(Button, {
									to: "/shop",
									variant: "outline",
									children: "View all"
								})]
							}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ProductGrid, {
								products: visible,
								columns: "four",
								prioritiseFirst: 4
							}), hasMore && /* @__PURE__ */ jsxs("div", {
								className: "mt-16 flex flex-col items-center gap-4",
								children: [
									/* @__PURE__ */ jsxs("p", {
										className: "text-xs text-muted",
										children: [
											"Showing ",
											visible.length,
											" of ",
											results.length
										]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "h-[2px] w-40 bg-shell",
										children: /* @__PURE__ */ jsx("div", {
											className: "h-full bg-ink transition-[width] duration-500",
											style: { width: `${visible.length / results.length * 100}%` }
										})
									}),
									/* @__PURE__ */ jsx(Button, {
										variant: "outline",
										size: "lg",
										onClick: () => setVisibleCount((current) => current + PAGE_SIZE),
										children: "Load more"
									})
								]
							})] })
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ jsx(Drawer, {
			open: drawerOpen,
			onClose: () => setDrawerOpen(false),
			title: "Filters",
			side: "left",
			widthClass: "max-w-[22rem]",
			footer: /* @__PURE__ */ jsxs("div", {
				className: "flex gap-2.5 px-5 py-4",
				children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					full: true,
					onClick: clearAll,
					children: "Clear"
				}), /* @__PURE__ */ jsxs(Button, {
					full: true,
					onClick: () => setDrawerOpen(false),
					children: ["Show ", results.length]
				})]
			}),
			children: /* @__PURE__ */ jsx("div", {
				className: "px-5 py-5",
				children: filterPanel
			})
		})
	] });
}
//#endregion
//#region src/components/QuantitySelector.jsx
/** Accessible stepper used on the product page, bag drawer and cart. */
function QuantitySelector({ value, onChange, min = 1, max = 10, size = "md", label = "Quantity", className }) {
	const dimensions = size === "sm" ? "h-9 w-9" : "h-11 w-11";
	const textSize = size === "sm" ? "text-xs w-8" : "text-sm w-10";
	return /* @__PURE__ */ jsxs("div", {
		className: cx("inline-flex items-center border border-line bg-white", className),
		role: "group",
		"aria-label": label,
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => onChange(Math.max(min, value - 1)),
				disabled: value <= min,
				"aria-label": "Decrease quantity",
				className: cx(dimensions, "flex items-center justify-center text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent"),
				children: /* @__PURE__ */ jsx(Minus, {
					size: 14,
					strokeWidth: 1.5
				})
			}),
			/* @__PURE__ */ jsx("span", {
				className: cx("text-center tabular-nums", textSize),
				"aria-live": "polite",
				"aria-label": `${label}: ${value}`,
				children: value
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => onChange(Math.min(max, value + 1)),
				disabled: value >= max,
				"aria-label": "Increase quantity",
				className: cx(dimensions, "flex items-center justify-center text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent"),
				children: /* @__PURE__ */ jsx(Plus, {
					size: 14,
					strokeWidth: 1.5
				})
			})
		]
	});
}
//#endregion
//#region src/components/Accordion.jsx
/**
* Minimal accordion. `items` is an array of { id, title, content }.
* `defaultOpen` accepts an item id.
*/
function Accordion({ items = [], defaultOpen = null }) {
	const [openId, setOpenId] = useState(defaultOpen);
	return /* @__PURE__ */ jsx("div", {
		className: "divide-y divide-line border-y border-line",
		children: items.map((item) => {
			const isOpen = openId === item.id;
			return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: () => setOpenId(isOpen ? null : item.id),
				"aria-expanded": isOpen,
				"aria-controls": `panel-${item.id}`,
				className: "flex w-full items-center justify-between gap-4 py-5 text-left",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-sans text-[11px] font-normal uppercase tracking-[0.22em] text-ink",
					children: item.title
				}), /* @__PURE__ */ jsx("span", {
					className: "text-muted transition-colors group-hover:text-ink",
					children: isOpen ? /* @__PURE__ */ jsx(Minus, {
						size: 15,
						strokeWidth: 1.4
					}) : /* @__PURE__ */ jsx(Plus, {
						size: 15,
						strokeWidth: 1.4
					})
				})]
			}) }), /* @__PURE__ */ jsx("div", {
				id: `panel-${item.id}`,
				hidden: !isOpen,
				className: "animate-fade-in pb-6 text-sm leading-relaxed text-slate",
				children: item.content
			})] }, item.id);
		})
	});
}
//#endregion
//#region src/components/Modal.jsx
/**
* Centred modal dialog. Closes on Escape and on backdrop click, traps focus
* loosely by moving focus to the panel on open, and restores it on close.
*/
function Modal({ open, onClose, title, description, children, size = "md", hideClose = false }) {
	const panelRef = useRef(null);
	const previouslyFocused = useRef(null);
	useScrollLock(open);
	useEffect(() => {
		if (!open) return void 0;
		previouslyFocused.current = document.activeElement;
		const timer = window.setTimeout(() => panelRef.current?.focus(), 20);
		const onKeyDown = (event) => {
			if (event.key === "Escape") onClose?.();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("keydown", onKeyDown);
			if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus();
		};
	}, [open, onClose]);
	if (!open) return null;
	const widths = {
		sm: "max-w-md",
		md: "max-w-xl",
		lg: "max-w-3xl"
	};
	return createPortal(/* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-[90] flex items-end justify-center sm:items-center",
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": "Close dialog",
			onClick: onClose,
			className: "absolute inset-0 animate-fade-in cursor-default bg-ink/45 backdrop-blur-[2px]"
		}), /* @__PURE__ */ jsxs("div", {
			ref: panelRef,
			tabIndex: -1,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: cx("relative z-10 max-h-[92vh] w-full overflow-y-auto bg-cream shadow-[0_24px_60px_-28px_rgb(22_19_15/0.28)] outline-none", "animate-scale-in", widths[size] || widths.md),
			children: [!hideClose && /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: onClose,
				"aria-label": "Close",
				className: "absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-clay",
				children: /* @__PURE__ */ jsx(X, {
					size: 18,
					strokeWidth: 1.4
				})
			}), /* @__PURE__ */ jsxs("div", {
				className: "px-6 py-10 sm:px-10",
				children: [
					title && /* @__PURE__ */ jsx("h2", {
						className: "text-3xl sm:text-4xl",
						children: title
					}),
					description && /* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm leading-relaxed text-slate",
						children: description
					}),
					children
				]
			})]
		})]
	}), document.body);
}
//#endregion
//#region src/data/infoPages.js
/**
* Content for the policy / help pages linked from the footer.
* Each entry renders through `pages/InfoPage.jsx`, so adding a new
* policy page is a matter of adding one object here.
*/
var infoPages = {
	shipping: {
		title: "Shipping",
		eyebrow: "Help",
		intro: `We ship across India from our Chennai studio. Orders placed before 2 PM are packed and dispatched the same working day.`,
		sections: [
			{
				heading: "Delivery timelines",
				body: [
					"Metro cities: 2 to 3 working days.",
					"Rest of India: 4 to 6 working days.",
					"Remote pincodes may add 1 to 2 days. You will see the estimate at checkout."
				]
			},
			{
				heading: "Charges",
				body: [
					`Delivery is free on all orders above Rs.${store.freeShippingThreshold.toLocaleString("en-IN")}.`,
					`A flat fee of Rs.${store.deliveryFee} applies below that value.`,
					`Cash on delivery carries a handling fee of Rs.${store.codFee}.`
				]
			},
			{
				heading: "Tracking",
				body: ["A tracking link is sent by email and SMS as soon as your parcel leaves the studio.", `If anything looks off, message us on WhatsApp at ${store.phone} and we will chase it for you.`]
			}
		]
	},
	returns: {
		title: "Returns & Exchanges",
		eyebrow: "Help",
		intro: `Try it on, live in it for a few days, and if it is not right we will make it right. Returns and size exchanges are accepted within ${store.returnWindowDays} days of delivery.`,
		sections: [{
			heading: "How it works",
			body: [
				"Reply to your order email or message us on WhatsApp with your order number.",
				"We arrange a free reverse pickup for serviceable pincodes.",
				"Refunds reach the original payment method within 5 to 7 working days of the parcel reaching us."
			]
		}, {
			heading: "Conditions",
			body: [
				"Tags intact, unworn, unwashed and in the original packaging.",
				"Innerwear, and pieces marked final sale, cannot be returned for hygiene reasons.",
				"Size exchanges are free once per order."
			]
		}]
	},
	"size-guide": {
		title: "Size Guide",
		eyebrow: "Help",
		intro: "All measurements are body measurements in inches. If you are between two sizes, we recommend the larger one for a relaxed drape.",
		sections: [
			{
				heading: "Womenswear",
				table: {
					head: [
						"Size",
						"Bust",
						"Waist",
						"Hip"
					],
					rows: [
						[
							"XS",
							"31",
							"24",
							"34"
						],
						[
							"S",
							"33",
							"26",
							"36"
						],
						[
							"M",
							"35",
							"28",
							"38"
						],
						[
							"L",
							"37.5",
							"30.5",
							"40.5"
						],
						[
							"XL",
							"40",
							"33",
							"43"
						],
						[
							"XXL",
							"42.5",
							"35.5",
							"45.5"
						]
					]
				}
			},
			{
				heading: "Menswear",
				table: {
					head: [
						"Size",
						"Chest",
						"Waist",
						"Shoulder"
					],
					rows: [
						[
							"S",
							"38",
							"32",
							"17"
						],
						[
							"M",
							"40",
							"34",
							"17.5"
						],
						[
							"L",
							"42",
							"36",
							"18"
						],
						[
							"XL",
							"44",
							"38",
							"18.5"
						],
						[
							"XXL",
							"46",
							"40",
							"19"
						]
					]
				}
			},
			{
				heading: "Denim and trousers",
				body: [
					"Denim is listed by waist measurement in inches: 28, 30, 32, 34 and 36.",
					"Inseam is 31 inches on regular fits and 30 inches on relaxed fits.",
					"Our in-store team offers free length alterations on all trousers."
				]
			},
			{
				heading: "Still unsure?",
				body: [`Send us the garment you already own and love, and we will match it. WhatsApp ${store.phone}.`]
			}
		]
	},
	faqs: {
		title: "Frequently Asked Questions",
		eyebrow: "Help",
		intro: "The questions our customers ask most. If yours is not here, we are one message away.",
		sections: [
			{
				heading: "Is this an online-only brand?",
				body: [`No. We have a flagship store at ${formattedAddress}, and everything you see online can be tried on in person.`]
			},
			{
				heading: "Do you offer alterations?",
				body: ["Yes. Length and waist alterations are complimentary on all full-price purchases made in store."]
			},
			{
				heading: "How do I know a piece is in stock?",
				body: ["Sizes that are unavailable appear crossed out on the product page. Everything else is ready to ship."]
			},
			{
				heading: "Can I order over WhatsApp?",
				body: [`Absolutely. Message ${store.phone} with a screenshot of what you like and we will place the order for you.`]
			},
			{
				heading: "Do you restock sold out pieces?",
				body: ["Core essentials are restocked every three weeks. Seasonal and festive pieces are made in limited runs."]
			}
		]
	},
	privacy: {
		title: "Privacy Policy",
		eyebrow: "Legal",
		intro: "This is a demonstration storefront. The policy below outlines the approach a real VERA store would take with customer data.",
		sections: [
			{
				heading: "What we collect",
				body: ["Contact details you enter at checkout: name, email, phone and delivery address.", "Your bag and wishlist, which are stored only in your own browser using local storage."]
			},
			{
				heading: "What we never do",
				body: ["We do not sell or rent customer data to third parties.", "We do not store card details. Payments would be handled by a certified payment gateway."]
			},
			{
				heading: "Your choices",
				body: ["You can unsubscribe from marketing email at any time from the footer of any newsletter.", `To request deletion of your data, write to ${store.email}.`]
			}
		]
	},
	terms: {
		title: "Terms of Service",
		eyebrow: "Legal",
		intro: "These terms describe how orders are placed and fulfilled. This site is a portfolio demonstration and no real transactions are processed.",
		sections: [
			{
				heading: "Orders",
				body: ["An order is confirmed once you receive an order number by email.", "We may cancel an order where a pricing or stock error has occurred, with a full refund."]
			},
			{
				heading: "Pricing",
				body: ["All prices are in Indian Rupees and include applicable GST.", "Promotional pricing applies only while a campaign is live and cannot be applied retrospectively."]
			},
			{
				heading: "Demo notice",
				body: ["Checkout on this site is a user interface demonstration only. No payment is captured and no goods are dispatched."]
			}
		]
	}
};
var infoPageSlugs = Object.keys(infoPages);
var getInfoPage = (slug) => infoPages[slug];
//#endregion
//#region src/components/SizeGuideModal.jsx
var GUIDE = infoPages["size-guide"];
/** Size tables lifted straight from the size guide page content. */
function SizeGuideModal({ open, onClose }) {
	return /* @__PURE__ */ jsx(Modal, {
		open,
		onClose,
		title: "Size Guide",
		size: "lg",
		description: GUIDE.intro,
		children: /* @__PURE__ */ jsxs("div", {
			className: "mt-8 space-y-9",
			children: [GUIDE.sections.filter((section) => section.table).map((section) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "mb-3 font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-ink",
				children: section.heading
			}), /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-full min-w-[22rem] border-collapse text-sm",
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
						className: "border-y border-line bg-sand/60 text-left",
						children: section.table.head.map((cell) => /* @__PURE__ */ jsx("th", {
							scope: "col",
							className: "px-3 py-2.5 text-[10px] font-normal uppercase tracking-[0.16em] text-slate",
							children: cell
						}, cell))
					}) }), /* @__PURE__ */ jsx("tbody", { children: section.table.rows.map((row) => /* @__PURE__ */ jsx("tr", {
						className: "border-b border-line/70",
						children: row.map((cell, index) => /* @__PURE__ */ jsx("td", {
							className: index === 0 ? "px-3 py-2.5 uppercase tracking-[0.08em] text-ink" : "px-3 py-2.5 tabular-nums text-slate",
							children: cell
						}, `${row[0]}-${index}`))
					}, row[0])) })]
				})
			})] }, section.heading)), /* @__PURE__ */ jsxs("p", {
				className: "border-t border-line pt-6 text-sm text-slate",
				children: [
					"Between two sizes? Message us on WhatsApp at ",
					store.phone,
					" and our stylists will help you choose."
				]
			})]
		})
	});
}
//#endregion
//#region src/pages/ProductDetails.jsx
function ProductDetails() {
	const { id } = useParams();
	const product = getProductById(id);
	const navigate = useNavigate();
	const { addItem } = useCart();
	const { openCart } = useUI();
	const { toast } = useToast();
	const [activeImage, setActiveImage] = useState(0);
	const [size, setSize] = useState("");
	const [color, setColor] = useState("");
	const [quantity, setQuantity] = useState(1);
	const [sizeError, setSizeError] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);
	useEffect(() => {
		if (!product) return;
		setActiveImage(0);
		setQuantity(1);
		setSizeError(false);
		setColor(product.colors?.[0]?.name || "");
		setSize(product.sizes?.length === 1 ? product.sizes[0] : "");
	}, [product]);
	const reviews = useMemo(() => reviewsFor(product), [product]);
	const related = useMemo(() => relatedProducts(product, 4), [product]);
	if (!product) return /* @__PURE__ */ jsx(Navigate, {
		to: "/not-found",
		replace: true
	});
	const needsSize = product.sizes.length > 1;
	const eta = deliveryWindow();
	const resolveSize = () => size || product.sizes?.[0] || "One Size";
	const handleAdd = ({ thenCheckout = false } = {}) => {
		if (needsSize && !size) {
			setSizeError(true);
			toast("Select a size to continue", {
				tone: "info",
				description: product.name
			});
			document.getElementById("size-selector")?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			return;
		}
		addItem(product, {
			size: resolveSize(),
			color,
			quantity
		});
		if (thenCheckout) {
			navigate("/checkout");
			return;
		}
		toast("Added to bag", { description: `${product.name} - ${resolveSize()}` });
		openCart();
	};
	const step = (direction) => {
		setActiveImage((current) => {
			const next = current + direction;
			if (next < 0) return product.images.length - 1;
			if (next >= product.images.length) return 0;
			return next;
		});
	};
	const accordionItems = [
		{
			id: "details",
			title: "Product details",
			content: /* @__PURE__ */ jsxs("ul", {
				className: "space-y-2.5",
				children: [product.highlights.map((highlight) => /* @__PURE__ */ jsxs("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ jsx(Check, {
						size: 15,
						strokeWidth: 1.4,
						className: "mt-0.5 shrink-0 text-clay"
					}), highlight]
				}, highlight)), /* @__PURE__ */ jsxs("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ jsx(Check, {
						size: 15,
						strokeWidth: 1.4,
						className: "mt-0.5 shrink-0 text-clay"
					}), product.details.origin]
				})]
			})
		},
		{
			id: "fabric",
			title: "Fabric, fit and care",
			content: /* @__PURE__ */ jsx("dl", {
				className: "space-y-3",
				children: [
					["Fabric", product.details.fabric],
					["Fit", product.details.fit],
					["Care", product.details.care]
				].map(([label, value]) => /* @__PURE__ */ jsxs("div", {
					className: "grid gap-1 sm:grid-cols-[6rem_1fr] sm:gap-4",
					children: [/* @__PURE__ */ jsx("dt", {
						className: "text-[10px] uppercase tracking-[0.16em] text-muted",
						children: label
					}), /* @__PURE__ */ jsx("dd", { children: value })]
				}, label))
			})
		},
		{
			id: "shipping",
			title: "Shipping and returns",
			content: /* @__PURE__ */ jsxs("ul", {
				className: "space-y-2.5",
				children: [
					/* @__PURE__ */ jsxs("li", { children: [
						"Free delivery on orders above",
						" ",
						formatPrice(store.freeShippingThreshold),
						", otherwise ",
						formatPrice(store.deliveryFee),
						"."
					] }),
					/* @__PURE__ */ jsxs("li", { children: [
						"Estimated arrival ",
						eta,
						" for most pincodes in India."
					] }),
					/* @__PURE__ */ jsxs("li", { children: [store.returnWindowDays, " day returns and one free size exchange, with reverse pickup at your door."] })
				]
			})
		}
	];
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: product.name,
			description: `${product.name} - ${product.description.slice(0, 130)}`
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					to: "/"
				},
				{
					label: "Shop",
					to: "/shop"
				},
				{
					label: product.category,
					to: `/shop?category=${encodeURIComponent(product.category)}`
				},
				{ label: product.name }
			] })
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pb-16 pt-7 lg:pb-24",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-10 lg:grid-cols-2 lg:gap-16",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ jsx(SmartImage, {
							src: product.images[activeImage],
							alt: `${product.name} - view ${activeImage + 1} of ${product.images.length}`,
							ratio: "aspect-[4/5]",
							priority: true,
							sizes: "(min-width: 1024px) 48vw, 100vw",
							className: "animate-fade-in"
						}, product.images[activeImage]),
						product.images.length > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => step(-1),
							"aria-label": "Previous image",
							className: "absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-cream/85 text-ink backdrop-blur-sm transition-colors hover:bg-cream",
							children: /* @__PURE__ */ jsx(ChevronLeft, {
								size: 18,
								strokeWidth: 1.4
							})
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => step(1),
							"aria-label": "Next image",
							className: "absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-cream/85 text-ink backdrop-blur-sm transition-colors hover:bg-cream",
							children: /* @__PURE__ */ jsx(ChevronRight, {
								size: 18,
								strokeWidth: 1.4
							})
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5",
							children: [product.isNew && /* @__PURE__ */ jsx("span", {
								className: "bg-ink px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream",
								children: "New"
							}), product.discount > 0 && /* @__PURE__ */ jsxs("span", {
								className: "bg-clay px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream",
								children: [product.discount, "% Off"]
							})]
						})
					]
				}), product.images.length > 1 && /* @__PURE__ */ jsx("div", {
					className: "mt-3 grid grid-cols-4 gap-3",
					children: product.images.map((image, index) => /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setActiveImage(index),
						"aria-label": `Show image ${index + 1}`,
						"aria-current": index === activeImage,
						className: cx("overflow-hidden border transition-colors", index === activeImage ? "border-ink" : "border-transparent hover:border-line"),
						children: /* @__PURE__ */ jsx("img", {
							src: image,
							alt: "",
							loading: "lazy",
							className: "aspect-[3/4] w-full bg-sand object-cover"
						})
					}, image))
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "lg:pt-2",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-[10px] uppercase tracking-[0.22em] text-muted",
							children: [
								product.gender,
								" / ",
								product.category
							]
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "mt-3 text-[2.1rem] leading-[1.06] sm:text-[2.7rem]",
							children: product.name
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2",
							children: [
								/* @__PURE__ */ jsx(Rating, {
									value: product.rating,
									showValue: true
								}),
								/* @__PURE__ */ jsxs("a", {
									href: "#reviews",
									className: "text-xs text-slate underline-offset-4 transition-colors hover:text-ink hover:underline",
									children: [product.reviewCount, " reviews"]
								}),
								product.isBestSeller && /* @__PURE__ */ jsxs("span", {
									className: "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-clay",
									children: [/* @__PURE__ */ jsx(BadgeCheck, {
										size: 13,
										strokeWidth: 1.5
									}), "Best seller"]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-6 flex flex-wrap items-baseline gap-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-display text-3xl tabular-nums text-ink",
								children: formatPrice(product.price)
							}), product.originalPrice && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
								className: "text-base tabular-nums text-muted line-through",
								children: formatPrice(product.originalPrice)
							}), /* @__PURE__ */ jsxs("span", {
								className: "bg-clay/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-clay",
								children: [
									"Save ",
									product.discount,
									"%"
								]
							})] })]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1.5 text-xs text-muted",
							children: "Inclusive of all taxes"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-6 max-w-lg text-sm leading-relaxed text-slate",
							children: product.description
						}),
						product.colors?.length > 0 && /* @__PURE__ */ jsxs("div", {
							className: "mt-8",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-baseline justify-between",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-[10px] uppercase tracking-[0.22em] text-ink",
									children: "Colour"
								}), /* @__PURE__ */ jsx("p", {
									className: "text-xs text-slate",
									children: color
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "mt-3 flex flex-wrap gap-2.5",
								children: product.colors.map((swatch) => /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setColor(swatch.name),
									"aria-label": swatch.name,
									"aria-pressed": color === swatch.name,
									title: swatch.name,
									className: cx("flex h-9 w-9 items-center justify-center rounded-full border transition-all", color === swatch.name ? "border-ink ring-1 ring-ink ring-offset-2 ring-offset-cream" : "border-line hover:border-ink/50"),
									children: /* @__PURE__ */ jsx("span", {
										className: "h-6 w-6 rounded-full",
										style: { backgroundColor: swatch.hex }
									})
								}, swatch.name))
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-8",
							id: "size-selector",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-baseline justify-between",
									children: [/* @__PURE__ */ jsxs("p", {
										className: "text-[10px] uppercase tracking-[0.22em] text-ink",
										children: ["Size", needsSize && /* @__PURE__ */ jsx("span", {
											className: "text-clay",
											children: " *"
										})]
									}), /* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => setGuideOpen(true),
										className: "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate transition-colors hover:text-ink",
										children: [/* @__PURE__ */ jsx(Ruler, {
											size: 13,
											strokeWidth: 1.4
										}), "Size guide"]
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: product.sizes.map((option) => /* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: () => {
											setSize(option);
											setSizeError(false);
										},
										"aria-pressed": size === option,
										className: cx("min-w-13 border px-3.5 py-3 text-[11px] uppercase tracking-[0.1em] transition-colors", size === option ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-ink/60"),
										children: option
									}, option))
								}),
								sizeError && /* @__PURE__ */ jsx("p", {
									role: "alert",
									className: "mt-2.5 text-xs text-clay",
									children: "Please choose a size before adding to your bag."
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-8",
							children: [/* @__PURE__ */ jsx("p", {
								className: "mb-3 text-[10px] uppercase tracking-[0.22em] text-ink",
								children: "Quantity"
							}), /* @__PURE__ */ jsx(QuantitySelector, {
								value: quantity,
								onChange: setQuantity
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-7 flex flex-col gap-2.5 sm:flex-row",
							children: [
								/* @__PURE__ */ jsx(Button, {
									onClick: () => handleAdd(),
									size: "lg",
									className: "flex-1",
									children: "Add to Cart"
								}),
								/* @__PURE__ */ jsx(Button, {
									onClick: () => handleAdd({ thenCheckout: true }),
									variant: "outline",
									size: "lg",
									className: "flex-1",
									children: "Buy Now"
								}),
								/* @__PURE__ */ jsx(WishlistButton, {
									product,
									variant: "inline",
									className: "sm:w-auto"
								})
							]
						}),
						/* @__PURE__ */ jsx("a", {
							href: whatsappLink(`Hi ${store.storeNamePlain}, I would like to know more about the ${product.name}.`),
							target: "_blank",
							rel: "noreferrer noopener",
							className: "mt-4 inline-block text-xs text-slate underline-offset-4 transition-colors hover:text-ink hover:underline",
							children: "Questions about fit? Ask us on WhatsApp"
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "mt-9 grid gap-4 border-y border-line py-7 sm:grid-cols-3",
							children: [
								{
									Icon: Truck,
									title: "Fast delivery",
									copy: eta
								},
								{
									Icon: RotateCcw,
									title: `${store.returnWindowDays} day returns`,
									copy: "Free reverse pickup"
								},
								{
									Icon: ShieldCheck,
									title: "Quality checked",
									copy: "Three stage inspection"
								}
							].map(({ Icon, title, copy }) => /* @__PURE__ */ jsxs("li", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ jsx(Icon, {
									size: 17,
									strokeWidth: 1.3,
									className: "mt-0.5 shrink-0 text-clay"
								}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
									className: "block text-[10px] uppercase tracking-[0.16em] text-ink",
									children: title
								}), /* @__PURE__ */ jsx("span", {
									className: "mt-1 block text-xs text-slate",
									children: copy
								})] })]
							}, title))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-8",
							children: /* @__PURE__ */ jsx(Accordion, {
								items: accordionItems,
								defaultOpen: "details"
							})
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			id: "reviews",
			className: "border-t border-line bg-sand/40",
			children: /* @__PURE__ */ jsx("div", {
				className: "shell py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16",
					children: [/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "eyebrow",
							children: "Reviews"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-4 font-display text-5xl leading-none text-ink",
							children: product.rating.toFixed(1)
						}),
						/* @__PURE__ */ jsx(Rating, {
							value: product.rating,
							className: "mt-3",
							size: 16
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-3 text-sm text-slate",
							children: [
								"Based on ",
								product.reviewCount,
								" verified purchases"
							]
						}),
						/* @__PURE__ */ jsx("a", {
							href: whatsappLink(`Hi ${store.storeNamePlain}, I would like to share feedback about the ${product.name}.`),
							target: "_blank",
							rel: "noreferrer noopener",
							className: "mt-6 inline-block text-[10px] uppercase tracking-[0.18em] text-ink underline-offset-4 transition-colors hover:text-clay hover:underline",
							children: "Share your feedback"
						})
					] }), /* @__PURE__ */ jsx("ul", {
						className: "space-y-5",
						children: reviews.map((review) => /* @__PURE__ */ jsxs("li", {
							className: "border border-line bg-white p-6",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex flex-wrap items-center justify-between gap-3",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ jsx(Rating, {
											value: review.rating,
											size: 13
										}), /* @__PURE__ */ jsxs("span", {
											className: "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-clay",
											children: [/* @__PURE__ */ jsx(BadgeCheck, {
												size: 12,
												strokeWidth: 1.6
											}), "Verified"]
										})]
									}), /* @__PURE__ */ jsx("span", {
										className: "text-xs text-muted",
										children: review.date
									})]
								}),
								/* @__PURE__ */ jsx("h3", {
									className: "mt-3.5 font-display text-xl text-ink",
									children: review.title
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-sm leading-relaxed text-slate",
									children: review.body
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-4 text-[10px] uppercase tracking-[0.16em] text-muted",
									children: review.name
								})
							]
						}, `${review.name}-${review.date}`))
					})]
				})
			})
		}),
		related.length > 0 && /* @__PURE__ */ jsxs("section", {
			className: "shell py-16 lg:py-24",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "You may also like",
				title: "Complete the look",
				titleId: "related-heading",
				linkTo: `/shop?category=${encodeURIComponent(product.category)}`,
				linkLabel: `More ${product.category.toLowerCase()}`,
				className: "mb-12"
			}), /* @__PURE__ */ jsx(ProductGrid, {
				products: related,
				columns: "four"
			})]
		}),
		/* @__PURE__ */ jsx(SizeGuideModal, {
			open: guideOpen,
			onClose: () => setGuideOpen(false)
		})
	] });
}
//#endregion
//#region src/pages/Cart.jsx
function Cart() {
	const { items, totalItems, subtotal, savings, listTotal, delivery, total, increment, decrement, removeItem, clearCart, qualifiesForFreeShipping, amountToFreeShipping, isEmpty } = useCart();
	const { add: addToWishlist, isWishlisted } = useWishlist();
	const { toast } = useToast();
	const moveToWishlist = (line) => {
		if (!isWishlisted(line.productId)) addToWishlist(line.productId);
		removeItem(line.key);
		toast("Moved to wishlist", {
			tone: "wishlist",
			description: line.product.name
		});
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Shopping Bag",
			description: "Review the pieces in your VERA bag and check out securely with cash on delivery, UPI or card."
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				to: "/"
			}, { label: "Bag" }] })
		}),
		isEmpty ? /* @__PURE__ */ jsxs("div", {
			className: "shell pb-24 pt-6",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "text-[2.4rem] leading-none sm:text-[3.2rem]",
				children: "Shopping Bag"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-8 border border-line bg-white",
				children: /* @__PURE__ */ jsxs(EmptyState, {
					icon: ShoppingBag,
					title: "Your bag is waiting.",
					description: "You have not added anything yet. Browse the new season and start building your edit.",
					children: [/* @__PURE__ */ jsx(Button, {
						to: "/shop",
						children: "Continue Shopping"
					}), /* @__PURE__ */ jsx(Button, {
						to: "/wishlist",
						variant: "outline",
						children: "View wishlist"
					})]
				})
			})]
		}) : /* @__PURE__ */ jsxs("div", {
			className: "shell pb-24 pt-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-[2.4rem] leading-none sm:text-[3.2rem]",
					children: "Shopping Bag"
				}), /* @__PURE__ */ jsxs("p", {
					className: "mt-3 text-sm text-slate",
					children: [pluralise(totalItems, "item"), " in your bag"]
				})] }), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => {
						clearCart();
						toast("Bag cleared", { tone: "info" });
					},
					className: "text-[10px] uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-clay hover:underline",
					children: "Clear bag"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14 xl:grid-cols-[1fr_24rem]",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-6 flex items-center gap-3 border border-line bg-sand/50 px-4 py-3.5 text-xs text-slate",
						children: [/* @__PURE__ */ jsx(Truck, {
							size: 15,
							strokeWidth: 1.4,
							className: "shrink-0 text-clay"
						}), qualifiesForFreeShipping ? /* @__PURE__ */ jsxs("span", { children: [
							"Free delivery applied. Estimated arrival",
							" ",
							/* @__PURE__ */ jsx("span", {
								className: "text-ink",
								children: deliveryWindow()
							}),
							"."
						] }) : /* @__PURE__ */ jsxs("span", { children: [
							"Add ",
							/* @__PURE__ */ jsx("span", {
								className: "text-ink",
								children: formatPrice(amountToFreeShipping)
							}),
							" more to unlock free delivery."
						] })]
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "divide-y divide-line border-y border-line",
						children: items.map((line) => /* @__PURE__ */ jsxs("li", {
							className: "flex gap-4 py-6 sm:gap-6",
							children: [/* @__PURE__ */ jsx(Link, {
								to: `/product/${line.productId}`,
								className: "shrink-0",
								children: /* @__PURE__ */ jsx("img", {
									src: line.product.images[0],
									alt: line.product.name,
									loading: "lazy",
									className: "h-36 w-27 bg-sand object-cover sm:h-44 sm:w-33"
								})
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex min-w-0 flex-1 flex-col",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-start justify-between gap-4",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-[10px] uppercase tracking-[0.18em] text-muted",
												children: line.product.category
											}),
											/* @__PURE__ */ jsx("h2", {
												className: "mt-1.5 font-sans text-[0.95rem] leading-snug",
												children: /* @__PURE__ */ jsx(Link, {
													to: `/product/${line.productId}`,
													className: "link-underline text-ink",
													children: line.product.name
												})
											}),
											/* @__PURE__ */ jsxs("dl", {
												className: "mt-2.5 space-y-1 text-xs text-slate",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "flex gap-2",
													children: [/* @__PURE__ */ jsx("dt", {
														className: "text-muted",
														children: "Size"
													}), /* @__PURE__ */ jsx("dd", { children: line.size })]
												}), /* @__PURE__ */ jsxs("div", {
													className: "flex gap-2",
													children: [/* @__PURE__ */ jsx("dt", {
														className: "text-muted",
														children: "Colour"
													}), /* @__PURE__ */ jsx("dd", { children: line.color })]
												})]
											})
										]
									}), /* @__PURE__ */ jsxs("div", {
										className: "shrink-0 text-right",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-[0.95rem] tabular-nums text-ink",
											children: formatPrice(line.lineTotal)
										}), line.product.originalPrice && /* @__PURE__ */ jsx("p", {
											className: "mt-1 text-xs tabular-nums text-muted line-through",
											children: formatPrice(line.product.originalPrice * line.quantity)
										})]
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5",
									children: [
										/* @__PURE__ */ jsx(QuantitySelector, {
											size: "sm",
											value: line.quantity,
											onChange: (next) => next > line.quantity ? increment(line.key) : decrement(line.key)
										}),
										/* @__PURE__ */ jsxs("button", {
											type: "button",
											onClick: () => moveToWishlist(line),
											className: "inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate transition-colors hover:text-clay",
											children: [/* @__PURE__ */ jsx(Heart, {
												size: 13,
												strokeWidth: 1.5
											}), "Move to wishlist"]
										}),
										/* @__PURE__ */ jsxs("button", {
											type: "button",
											onClick: () => {
												removeItem(line.key);
												toast("Removed from bag", {
													tone: "info",
													description: line.product.name
												});
											},
											className: "inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate transition-colors hover:text-clay",
											children: [/* @__PURE__ */ jsx(Trash, {
												size: 13,
												strokeWidth: 1.5
											}), "Remove"]
										})
									]
								})]
							})]
						}, line.key))
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-8",
						children: /* @__PURE__ */ jsx(Button, {
							to: "/shop",
							variant: "quiet",
							size: "sm",
							className: "px-0",
							children: "Continue shopping"
						})
					})
				] }), /* @__PURE__ */ jsxs("aside", {
					className: "lg:sticky lg:top-28 lg:self-start",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "border border-line bg-white p-6",
						children: [
							/* @__PURE__ */ jsx("h2", {
								className: "text-[11px] font-normal uppercase tracking-[0.24em] text-ink",
								children: "Order Summary"
							}),
							/* @__PURE__ */ jsxs("dl", {
								className: "mt-6 space-y-3 text-sm",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("dt", {
											className: "text-slate",
											children: "Bag total"
										}), /* @__PURE__ */ jsx("dd", {
											className: "tabular-nums",
											children: formatPrice(listTotal)
										})]
									}),
									savings > 0 && /* @__PURE__ */ jsxs("div", {
										className: "flex justify-between text-clay",
										children: [/* @__PURE__ */ jsx("dt", { children: "Discount" }), /* @__PURE__ */ jsxs("dd", {
											className: "tabular-nums",
											children: ["-", formatPrice(savings)]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("dt", {
											className: "text-slate",
											children: "Subtotal"
										}), /* @__PURE__ */ jsx("dd", {
											className: "tabular-nums",
											children: formatPrice(subtotal)
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("dt", {
											className: "text-slate",
											children: "Delivery"
										}), /* @__PURE__ */ jsx("dd", {
											className: "tabular-nums",
											children: delivery === 0 ? "Free" : formatPrice(delivery)
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-baseline justify-between border-t border-line pt-4",
										children: [/* @__PURE__ */ jsx("dt", {
											className: "text-base",
											children: "Total"
										}), /* @__PURE__ */ jsx("dd", {
											className: "font-display text-2xl tabular-nums",
											children: formatPrice(total)
										})]
									})
								]
							}),
							savings > 0 && /* @__PURE__ */ jsxs("p", {
								className: "mt-4 bg-clay/8 px-3 py-2.5 text-xs text-clay",
								children: [
									"You are saving ",
									formatPrice(savings),
									" on this order."
								]
							}),
							/* @__PURE__ */ jsx(Button, {
								to: "/checkout",
								full: true,
								size: "lg",
								className: "mt-6",
								children: "Proceed to Checkout"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-muted",
								children: "Cash on delivery available"
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-4 border border-line bg-sand/40 p-5 text-xs leading-relaxed text-slate",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "mb-2 text-[10px] uppercase tracking-[0.18em] text-ink",
								children: "Need help?"
							}),
							"Call us at ",
							store.phone,
							" between 10:30 AM and 9:00 PM, or message us on WhatsApp any time."
						]
					})]
				})]
			})]
		})
	] });
}
//#endregion
//#region src/pages/Wishlist.jsx
function Wishlist() {
	const { items, remove, clear, isEmpty } = useWishlist();
	const { addItem } = useCart();
	const { openCart } = useUI();
	const { toast } = useToast();
	const moveToBag = (product) => {
		const size = product.sizes?.length === 1 ? product.sizes[0] : product.sizes?.[0] || "One Size";
		addItem(product, {
			size,
			color: product.colors?.[0]?.name,
			quantity: 1
		});
		remove(product.id);
		toast("Moved to bag", { description: `${product.name} - ${size}` });
		openCart();
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Wishlist",
			description: "Your saved VERA pieces, kept in your browser so they are here when you return."
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				to: "/"
			}, { label: "Wishlist" }] })
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "shell pb-24 pt-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-[2.4rem] leading-none sm:text-[3.2rem]",
					children: "Wishlist"
				}), !isEmpty && /* @__PURE__ */ jsxs("p", {
					className: "mt-3 text-sm text-slate",
					children: [pluralise(items.length, "piece"), " saved"]
				})] }), !isEmpty && /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => {
						clear();
						toast("Wishlist cleared", { tone: "info" });
					},
					className: "text-[10px] uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-clay hover:underline",
					children: "Clear wishlist"
				})]
			}), isEmpty ? /* @__PURE__ */ jsx("div", {
				className: "mt-8 border border-line bg-white",
				children: /* @__PURE__ */ jsxs(EmptyState, {
					icon: Heart,
					title: "Your wishlist is waiting for something special.",
					description: "Tap the heart on any piece to save it here. Your list stays in this browser, so it will be here when you return.",
					children: [/* @__PURE__ */ jsx(Button, {
						to: "/shop",
						children: "Browse the collection"
					}), /* @__PURE__ */ jsx(Button, {
						to: "/shop?tag=new",
						variant: "outline",
						children: "See new arrivals"
					})]
				})
			}) : /* @__PURE__ */ jsx("ul", {
				className: "mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
				children: items.map((product) => /* @__PURE__ */ jsxs("li", {
					className: "group flex flex-col",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "relative overflow-hidden bg-sand",
						children: [
							/* @__PURE__ */ jsx(Link, {
								to: `/product/${product.id}`,
								"aria-label": `View ${product.name}`,
								children: /* @__PURE__ */ jsx("img", {
									src: product.images[0],
									alt: `${product.name} - ${product.category}`,
									loading: "lazy",
									className: "aspect-[3/4] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
								})
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => {
									remove(product.id);
									toast("Removed from wishlist", {
										tone: "info",
										description: product.name
									});
								},
								"aria-label": `Remove ${product.name} from wishlist`,
								className: "absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-ink/10 bg-cream/90 text-ink backdrop-blur-sm transition-colors hover:bg-cream hover:text-clay",
								children: /* @__PURE__ */ jsx(X, {
									size: 15,
									strokeWidth: 1.5
								})
							}),
							product.discount > 0 && /* @__PURE__ */ jsxs("span", {
								className: "absolute left-3 top-3 bg-clay px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream",
								children: [product.discount, "% Off"]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-1 flex-col pt-4",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[10px] uppercase tracking-[0.2em] text-muted",
								children: product.category
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "mt-1.5 font-sans text-[0.9rem] font-normal leading-snug",
								children: /* @__PURE__ */ jsx(Link, {
									to: `/product/${product.id}`,
									className: "link-underline text-ink",
									children: product.name
								})
							}),
							/* @__PURE__ */ jsx(Rating, {
								value: product.rating,
								size: 12,
								className: "mt-2"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-2 flex items-baseline gap-2.5",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[0.9rem] tabular-nums text-ink",
									children: formatPrice(product.price)
								}), product.originalPrice && /* @__PURE__ */ jsx("span", {
									className: "text-xs tabular-nums text-muted line-through",
									children: formatPrice(product.originalPrice)
								})]
							}),
							/* @__PURE__ */ jsxs(Button, {
								onClick: () => moveToBag(product),
								size: "sm",
								full: true,
								className: "mt-4",
								"aria-label": `Move ${product.name} to bag`,
								children: [/* @__PURE__ */ jsx(ShoppingBag, {
									size: 13,
									strokeWidth: 1.6
								}), "Move to bag"]
							})
						]
					})]
				}, product.id))
			})]
		})
	] });
}
//#endregion
//#region src/pages/Checkout.jsx
var PAYMENT_METHODS = [
	{
		id: "cod",
		label: "Cash on Delivery",
		Icon: Banknote,
		note: `Pay when it arrives. Handling fee ${formatPrice(store.codFee)}.`
	},
	{
		id: "upi",
		label: "UPI",
		Icon: Smartphone,
		note: "GPay, PhonePe, Paytm or any UPI app."
	},
	{
		id: "card",
		label: "Credit / Debit Card",
		Icon: CreditCard,
		note: "Visa, Mastercard, RuPay and Amex."
	}
];
var INITIAL_FORM = {
	fullName: "",
	email: "",
	phone: "",
	address: "",
	city: "",
	state: "",
	pincode: "",
	upiId: "",
	cardNumber: "",
	cardExpiry: "",
	cardCvv: "",
	notes: ""
};
var EMAIL_PATTERN$1 = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function Field({ label, name, value, onChange, error, type = "text", ...rest }) {
	const id = `field-${name}`;
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("label", {
			htmlFor: id,
			className: "mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate",
			children: label
		}),
		/* @__PURE__ */ jsx("input", {
			id,
			name,
			type,
			value,
			onChange,
			"aria-invalid": Boolean(error),
			"aria-describedby": error ? `${id}-error` : void 0,
			className: "field",
			...rest
		}),
		error && /* @__PURE__ */ jsx("p", {
			id: `${id}-error`,
			role: "alert",
			className: "mt-1.5 text-xs text-clay",
			children: error
		})
	] });
}
function Checkout() {
	const { items, totalItems, subtotal, savings, delivery, total, clearCart, isEmpty } = useCart();
	const [form, setForm] = useState(INITIAL_FORM);
	const [payment, setPayment] = useState("cod");
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const [order, setOrder] = useState(null);
	const codFee = payment === "cod" ? store.codFee : 0;
	const grandTotal = total + codFee;
	const summaryLines = useMemo(() => items.map((line) => ({
		key: line.key,
		name: line.product.name,
		image: line.product.images[0],
		meta: `${line.size} / ${line.color} / Qty ${line.quantity}`,
		amount: line.lineTotal
	})), [items]);
	const update = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({
			...current,
			[name]: value
		}));
		setErrors((current) => {
			if (!current[name]) return current;
			const next = { ...current };
			delete next[name];
			return next;
		});
	};
	const validate = () => {
		const next = {};
		if (form.fullName.trim().length < 3) next.fullName = "Enter your full name.";
		if (!EMAIL_PATTERN$1.test(form.email.trim())) next.email = "Enter a valid email address.";
		if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) next.phone = "Enter a valid 10 digit Indian mobile number.";
		if (form.address.trim().length < 8) next.address = "Enter your full delivery address.";
		if (form.city.trim().length < 2) next.city = "Enter your city.";
		if (form.state.trim().length < 2) next.state = "Enter your state.";
		if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = "Pincode must be 6 digits.";
		if (payment === "upi" && form.upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(form.upiId.trim())) next.upiId = "Enter a UPI id like name@bank.";
		if (payment === "card") {
			if (form.cardNumber.replace(/\s/g, "").length < 12) next.cardNumber = "Enter a card number (demo only, do not use a real card).";
			if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry.trim())) next.cardExpiry = "Use MM/YY.";
			if (!/^\d{3,4}$/.test(form.cardCvv.trim())) next.cardCvv = "CVV must be 3 or 4 digits.";
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};
	const placeOrder = (event) => {
		event.preventDefault();
		if (!validate()) {
			const firstError = document.querySelector("[aria-invalid=\"true\"]");
			firstError?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			firstError?.focus?.();
			return;
		}
		setSubmitting(true);
		window.setTimeout(() => {
			setOrder({
				id: generateOrderId(),
				name: form.fullName.trim(),
				email: form.email.trim(),
				phone: form.phone.trim(),
				address: `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} ${form.pincode.trim()}`,
				method: PAYMENT_METHODS.find((method) => method.id === payment)?.label,
				amount: grandTotal,
				items: totalItems,
				eta: deliveryWindow()
			});
			clearCart();
			setSubmitting(false);
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		}, 850);
	};
	if (order) return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(PageMeta, {
		title: "Order Confirmed",
		description: "Your VERA order has been confirmed."
	}), /* @__PURE__ */ jsx("div", {
		className: "shell py-16 lg:py-24",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-2xl animate-fade-up border border-line bg-white px-6 py-12 text-center sm:px-12",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "inline-flex h-16 w-16 items-center justify-center rounded-full bg-clay/10 text-clay",
					children: /* @__PURE__ */ jsx(CircleCheckBig, {
						size: 28,
						strokeWidth: 1.2
					})
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "mt-7 text-[2.3rem] leading-tight sm:text-[3rem]",
					children: "Order Confirmed!"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-4 text-sm leading-relaxed text-slate",
					children: [
						"Thank you for shopping with ",
						store.storeName,
						". A confirmation has been sent to",
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "text-ink",
							children: order.email
						}),
						"."
					]
				}),
				/* @__PURE__ */ jsx("dl", {
					className: "mt-9 divide-y divide-line border-y border-line text-left text-sm",
					children: [
						["Order ID", order.id],
						["Items", pluralise(order.items, "piece")],
						["Amount", formatPrice(order.amount)],
						["Payment", order.method],
						["Delivering to", order.address],
						["Estimated arrival", order.eta]
					].map(([label, value]) => /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 py-3.5 sm:grid sm:grid-cols-[9rem_1fr]",
						children: [/* @__PURE__ */ jsx("dt", {
							className: "text-[10px] uppercase tracking-[0.16em] text-muted sm:pt-0.5",
							children: label
						}), /* @__PURE__ */ jsx("dd", {
							className: "text-ink",
							children: value
						})]
					}, label))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-9 flex flex-wrap justify-center gap-3",
					children: [/* @__PURE__ */ jsx(Button, {
						to: "/shop",
						children: "Continue Shopping"
					}), /* @__PURE__ */ jsx(Button, {
						href: whatsappLink(`Hi ${store.storeNamePlain}, I just placed order ${order.id}.`),
						target: "_blank",
						rel: "noreferrer noopener",
						variant: "outline",
						children: "Track on WhatsApp"
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-8 text-xs text-muted",
					children: "This is a demonstration store. No payment has been taken and no order will be shipped."
				})
			]
		})
	})] });
	if (isEmpty) return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(PageMeta, {
		title: "Checkout",
		description: "Complete your VERA order."
	}), /* @__PURE__ */ jsx("div", {
		className: "shell py-16",
		children: /* @__PURE__ */ jsx("div", {
			className: "border border-line bg-white",
			children: /* @__PURE__ */ jsx(EmptyState, {
				icon: ShoppingBag,
				title: "Nothing to check out yet.",
				description: "Your bag is empty. Add a few pieces and we will be right here.",
				children: /* @__PURE__ */ jsx(Button, {
					to: "/shop",
					children: "Continue Shopping"
				})
			})
		})
	})] });
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Checkout",
			description: "Enter your delivery details and choose cash on delivery, UPI or card to complete your VERA order."
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [
				{
					label: "Home",
					to: "/"
				},
				{
					label: "Bag",
					to: "/cart"
				},
				{ label: "Checkout" }
			] })
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "shell pb-24 pt-6",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-[2.4rem] leading-none sm:text-[3.2rem]",
					children: "Checkout"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-3 flex flex-wrap items-center gap-2 text-sm text-slate",
					children: [/* @__PURE__ */ jsx(Lock, {
						size: 13,
						strokeWidth: 1.5,
						className: "text-clay"
					}), "Demo checkout. No payment is processed and no data leaves your browser."]
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: placeOrder,
					noValidate: true,
					className: "mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14 xl:grid-cols-[1fr_24rem]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-10",
						children: [
							/* @__PURE__ */ jsxs("section", {
								"aria-labelledby": "contact-heading",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "mb-5 flex items-baseline gap-3",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-display text-2xl text-clay",
										children: "01"
									}), /* @__PURE__ */ jsx("h2", {
										id: "contact-heading",
										className: "text-[11px] uppercase tracking-[0.24em] text-ink",
										children: "Contact Information"
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "sm:col-span-2",
											children: /* @__PURE__ */ jsx(Field, {
												label: "Full name",
												name: "fullName",
												value: form.fullName,
												onChange: update,
												error: errors.fullName,
												autoComplete: "name",
												placeholder: "Ananya Sharma"
											})
										}),
										/* @__PURE__ */ jsx(Field, {
											label: "Email",
											name: "email",
											type: "email",
											value: form.email,
											onChange: update,
											error: errors.email,
											autoComplete: "email",
											placeholder: "you@email.com"
										}),
										/* @__PURE__ */ jsx(Field, {
											label: "Phone",
											name: "phone",
											type: "tel",
											value: form.phone,
											onChange: update,
											error: errors.phone,
											autoComplete: "tel",
											inputMode: "numeric",
											maxLength: 10,
											placeholder: "98765 43210"
										})
									]
								})]
							}),
							/* @__PURE__ */ jsxs("section", {
								"aria-labelledby": "address-heading",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "mb-5 flex items-baseline gap-3",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-display text-2xl text-clay",
										children: "02"
									}), /* @__PURE__ */ jsx("h2", {
										id: "address-heading",
										className: "text-[11px] uppercase tracking-[0.24em] text-ink",
										children: "Delivery Address"
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "sm:col-span-2",
											children: [
												/* @__PURE__ */ jsx("label", {
													htmlFor: "field-address",
													className: "mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate",
													children: "Address"
												}),
												/* @__PURE__ */ jsx("textarea", {
													id: "field-address",
													name: "address",
													rows: 3,
													value: form.address,
													onChange: update,
													"aria-invalid": Boolean(errors.address),
													"aria-describedby": errors.address ? "field-address-error" : void 0,
													className: "field resize-none",
													placeholder: "Flat, building, street, landmark",
													autoComplete: "street-address"
												}),
												errors.address && /* @__PURE__ */ jsx("p", {
													id: "field-address-error",
													role: "alert",
													className: "mt-1.5 text-xs text-clay",
													children: errors.address
												})
											]
										}),
										/* @__PURE__ */ jsx(Field, {
											label: "City",
											name: "city",
											value: form.city,
											onChange: update,
											error: errors.city,
											autoComplete: "address-level2",
											placeholder: "Chennai"
										}),
										/* @__PURE__ */ jsx(Field, {
											label: "State",
											name: "state",
											value: form.state,
											onChange: update,
											error: errors.state,
											autoComplete: "address-level1",
											placeholder: "Tamil Nadu"
										}),
										/* @__PURE__ */ jsx(Field, {
											label: "Pincode",
											name: "pincode",
											value: form.pincode,
											onChange: update,
											error: errors.pincode,
											autoComplete: "postal-code",
											inputMode: "numeric",
											maxLength: 6,
											placeholder: "600002"
										}),
										/* @__PURE__ */ jsx(Field, {
											label: "Delivery notes (optional)",
											name: "notes",
											value: form.notes,
											onChange: update,
											placeholder: "Leave with security"
										})
									]
								})]
							}),
							/* @__PURE__ */ jsxs("section", {
								"aria-labelledby": "payment-heading",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "mb-5 flex items-baseline gap-3",
										children: [/* @__PURE__ */ jsx("span", {
											className: "font-display text-2xl text-clay",
											children: "03"
										}), /* @__PURE__ */ jsx("h2", {
											id: "payment-heading",
											className: "text-[11px] uppercase tracking-[0.24em] text-ink",
											children: "Payment Method"
										})]
									}),
									/* @__PURE__ */ jsx("div", {
										role: "radiogroup",
										"aria-label": "Payment method",
										className: "space-y-2.5",
										children: PAYMENT_METHODS.map(({ id, label, Icon, note }) => {
											const active = payment === id;
											return /* @__PURE__ */ jsxs("label", {
												className: cx("flex cursor-pointer items-start gap-4 border bg-white p-4 transition-colors", active ? "border-ink" : "border-line hover:border-ink/40"),
												children: [
													/* @__PURE__ */ jsx("input", {
														type: "radio",
														name: "payment",
														value: id,
														checked: active,
														onChange: () => {
															setPayment(id);
															setErrors({});
														},
														className: "sr-only"
													}),
													/* @__PURE__ */ jsx("span", {
														className: cx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", active ? "border-ink" : "border-line"),
														children: active && /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-ink" })
													}),
													/* @__PURE__ */ jsxs("span", {
														className: "flex-1",
														children: [/* @__PURE__ */ jsxs("span", {
															className: "flex items-center gap-2.5",
															children: [/* @__PURE__ */ jsx(Icon, {
																size: 16,
																strokeWidth: 1.4,
																className: "text-ink"
															}), /* @__PURE__ */ jsx("span", {
																className: "text-sm text-ink",
																children: label
															})]
														}), /* @__PURE__ */ jsx("span", {
															className: "mt-1 block text-xs text-slate",
															children: note
														})]
													})
												]
											}, id);
										})
									}),
									payment === "upi" && /* @__PURE__ */ jsxs("div", {
										className: "mt-4 animate-fade-in border border-line bg-sand/40 p-4",
										children: [/* @__PURE__ */ jsx(Field, {
											label: "UPI ID (optional for this demo)",
											name: "upiId",
											value: form.upiId,
											onChange: update,
											error: errors.upiId,
											placeholder: "yourname@okbank"
										}), /* @__PURE__ */ jsx("p", {
											className: "mt-3 text-xs text-slate",
											children: "In a live store this step would open your UPI app to approve the payment."
										})]
									}),
									payment === "card" && /* @__PURE__ */ jsxs("div", {
										className: "mt-4 animate-fade-in space-y-4 border border-line bg-sand/40 p-4",
										children: [
											/* @__PURE__ */ jsx(Field, {
												label: "Card number",
												name: "cardNumber",
												value: form.cardNumber,
												onChange: update,
												error: errors.cardNumber,
												inputMode: "numeric",
												maxLength: 19,
												placeholder: "4111 1111 1111 1111",
												autoComplete: "off"
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "grid gap-4 sm:grid-cols-2",
												children: [/* @__PURE__ */ jsx(Field, {
													label: "Expiry",
													name: "cardExpiry",
													value: form.cardExpiry,
													onChange: update,
													error: errors.cardExpiry,
													maxLength: 5,
													placeholder: "09/29",
													autoComplete: "off"
												}), /* @__PURE__ */ jsx(Field, {
													label: "CVV",
													name: "cardCvv",
													value: form.cardCvv,
													onChange: update,
													error: errors.cardCvv,
													inputMode: "numeric",
													maxLength: 4,
													placeholder: "123",
													autoComplete: "off"
												})]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xs text-clay",
												children: "Never enter real card details on a demonstration site. Any placeholder value works here."
											})
										]
									})
								]
							})
						]
					}), /* @__PURE__ */ jsx("aside", {
						className: "lg:sticky lg:top-28 lg:self-start",
						children: /* @__PURE__ */ jsxs("div", {
							className: "border border-line bg-white",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between border-b border-line px-6 py-5",
									children: [/* @__PURE__ */ jsx("h2", {
										className: "text-[11px] uppercase tracking-[0.24em] text-ink",
										children: "Order Summary"
									}), /* @__PURE__ */ jsx(Link, {
										to: "/cart",
										className: "text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink",
										children: "Edit"
									})]
								}),
								/* @__PURE__ */ jsx("ul", {
									className: "max-h-72 divide-y divide-line overflow-y-auto px-6",
									children: summaryLines.map((line) => /* @__PURE__ */ jsxs("li", {
										className: "flex gap-3.5 py-4",
										children: [
											/* @__PURE__ */ jsx("img", {
												src: line.image,
												alt: line.name,
												loading: "lazy",
												className: "h-20 w-16 shrink-0 bg-sand object-cover"
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ jsx("p", {
													className: "truncate text-sm text-ink",
													children: line.name
												}), /* @__PURE__ */ jsx("p", {
													className: "mt-1 text-[11px] uppercase tracking-[0.1em] text-muted",
													children: line.meta
												})]
											}),
											/* @__PURE__ */ jsx("span", {
												className: "shrink-0 text-sm tabular-nums text-ink",
												children: formatPrice(line.amount)
											})
										]
									}, line.key))
								}),
								/* @__PURE__ */ jsxs("dl", {
									className: "space-y-3 border-t border-line px-6 py-5 text-sm",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ jsx("dt", {
												className: "text-slate",
												children: "Subtotal"
											}), /* @__PURE__ */ jsx("dd", {
												className: "tabular-nums",
												children: formatPrice(subtotal)
											})]
										}),
										savings > 0 && /* @__PURE__ */ jsxs("div", {
											className: "flex justify-between text-clay",
											children: [/* @__PURE__ */ jsx("dt", { children: "Discount" }), /* @__PURE__ */ jsxs("dd", {
												className: "tabular-nums",
												children: ["-", formatPrice(savings)]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ jsx("dt", {
												className: "text-slate",
												children: "Delivery"
											}), /* @__PURE__ */ jsx("dd", {
												className: "tabular-nums",
												children: delivery === 0 ? "Free" : formatPrice(delivery)
											})]
										}),
										codFee > 0 && /* @__PURE__ */ jsxs("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ jsx("dt", {
												className: "text-slate",
												children: "COD handling"
											}), /* @__PURE__ */ jsx("dd", {
												className: "tabular-nums",
												children: formatPrice(codFee)
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-baseline justify-between border-t border-line pt-4",
											children: [/* @__PURE__ */ jsx("dt", {
												className: "text-base",
												children: "Total"
											}), /* @__PURE__ */ jsx("dd", {
												className: "font-display text-2xl tabular-nums",
												children: formatPrice(grandTotal)
											})]
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "px-6 pb-6",
									children: [/* @__PURE__ */ jsx(Button, {
										type: "submit",
										full: true,
										size: "lg",
										disabled: submitting,
										children: submitting ? "Placing order..." : "Place Order"
									}), /* @__PURE__ */ jsxs("p", {
										className: "mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted",
										children: [
											/* @__PURE__ */ jsx(Truck, {
												size: 13,
												strokeWidth: 1.5
											}),
											"Arrives ",
											deliveryWindow()
										]
									})]
								})
							]
						})
					})]
				})
			]
		})
	] });
}
//#endregion
//#region src/pages/About.jsx
var PILLARS = [
	{
		Icon: Scissors,
		title: "Made in small runs",
		body: "Every style is produced in limited batches with partner units in Tamil Nadu and Punjab, so we can watch the quality of each piece."
	},
	{
		Icon: Gem,
		title: "Fabric first",
		body: "We start with the cloth. Cotton, linen, silk and wool blends chosen for how they behave in Indian heat and humidity."
	},
	{
		Icon: Leaf,
		title: "Less, but better",
		body: "No weekly drops. Two considered collections a year, plus a small core range we remake and refine rather than replace."
	},
	{
		Icon: Sparkles,
		title: "Finished by hand",
		body: "Embroidery, hemming and final pressing are done by hand at our Chennai studio before anything is packed."
	}
];
function About() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Our Story",
			description: `${store.storeNamePlain} is an independent fashion label founded in ${store.established}, designing considered clothing in small runs from Chennai.`
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				to: "/"
			}, { label: "About" }] })
		}),
		/* @__PURE__ */ jsx("section", {
			className: "shell pb-16 pt-7 lg:pb-24",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "eyebrow",
						children: "Our story"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "mt-5 text-[2.6rem] leading-[1.02] sm:text-[3.6rem] lg:text-[4.2rem]",
						children: "Clothing built to be kept."
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-7 max-w-xl text-base leading-relaxed text-slate",
						children: [
							store.storeName,
							" began in ",
							store.established,
							" with a single rail in a small Chennai shopfront and one stubborn idea: that well-made clothes should not be a luxury reserved for a handful of labels."
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 max-w-xl text-base leading-relaxed text-slate",
						children: "A decade later we still work the same way. We choose the cloth first, cut a sample, wear it for a month, and only then decide whether it deserves to carry our name. What you see online is what hangs in our store, photographed as it is."
					}),
					/* @__PURE__ */ jsx(Button, {
						to: "/shop",
						className: "mt-9",
						size: "lg",
						children: "Shop the collection"
					})
				] }), /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsx(SmartImage, {
					src: buildImageUrl(PHOTOS.storefront, {
						w: 1100,
						h: 1200,
						crop: "entropy"
					}),
					alt: "The VERA boutique window with coats on display",
					ratio: "aspect-[4/5] lg:aspect-square",
					priority: true,
					sizes: "(min-width: 1024px) 45vw, 100vw"
				}) })]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "border-y border-line bg-sand/50",
			children: /* @__PURE__ */ jsx("div", {
				className: "shell py-16 lg:py-24",
				children: /* @__PURE__ */ jsxs("div", {
					className: "grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16",
					children: [/* @__PURE__ */ jsx(Reveal, {
						className: "order-2 lg:order-1",
						children: /* @__PURE__ */ jsx(SmartImage, {
							src: buildImageUrl(PHOTOS.atelier, {
								w: 1100,
								h: 800,
								crop: "entropy"
							}),
							alt: "Garments on a rail inside the VERA studio",
							ratio: "aspect-[4/3]",
							sizes: "(min-width: 1024px) 45vw, 100vw"
						})
					}), /* @__PURE__ */ jsxs("div", {
						className: "order-1 lg:order-2",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "eyebrow",
								children: "Our mission"
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "mt-4 text-[2.1rem] leading-[1.08] sm:text-[2.8rem]",
								children: "To make the honest version of premium."
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-6 max-w-xl text-base leading-relaxed text-slate",
								children: "Premium usually means a bigger margin rather than a better garment. We would rather spend the money on the fabric, the stitch count and the finishing, and keep the price somewhere a working professional can actually justify."
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-4 max-w-xl text-base leading-relaxed text-slate",
								children: "That means no inflated list prices, no permanent sale, and no photography that flatters a garment into something it is not."
							})
						]
					})]
				})
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "shell py-20 lg:py-28",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "How we work",
				title: "Quality, in practice",
				subtitle: "Four commitments that decide what we make and what we leave on the cutting table."
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2",
				children: PILLARS.map(({ Icon, title, body }, index) => /* @__PURE__ */ jsxs(Reveal, {
					delay: index * 80,
					className: "border-t border-line pt-7",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "inline-flex text-clay",
							children: /* @__PURE__ */ jsx(Icon, {
								size: 22,
								strokeWidth: 1.1
							})
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-4 font-display text-2xl text-ink",
							children: title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 max-w-md text-sm leading-relaxed text-slate",
							children: body
						})
					]
				}, title))
			})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "bg-ink",
			children: /* @__PURE__ */ jsxs("div", {
				className: "shell py-20 text-center lg:py-28",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[10px] uppercase tracking-[0.28em] text-cream/45",
						children: "Fashion philosophy"
					}),
					/* @__PURE__ */ jsx("blockquote", {
						className: "mx-auto mt-7 max-w-3xl font-display text-[1.8rem] leading-[1.25] text-cream sm:text-[2.6rem]",
						children: "Style is not the loudest thing in the room. It is the piece you reach for on the mornings that matter, five years after you bought it."
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-8 text-[10px] uppercase tracking-[0.22em] text-cream/50",
						children: [
							store.storeName,
							" Design Studio, ",
							store.address.city
						]
					})
				]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "shell py-20 lg:py-28",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16",
				children: [/* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsx(SmartImage, {
					src: buildImageUrl(PHOTOS.studio, {
						w: 1100,
						h: 820,
						crop: "entropy"
					}),
					alt: "Interior shelving inside the VERA flagship store",
					ratio: "aspect-[4/3]",
					sizes: "(min-width: 1024px) 48vw, 100vw"
				}) }), /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "eyebrow",
						children: "Visit us"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "mt-4 text-[2.1rem] leading-[1.08] sm:text-[2.6rem]",
						children: "Come and feel the fabric."
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 max-w-lg text-base leading-relaxed text-slate",
						children: "Our flagship store carries the full collection along with in-house alterations. Walk in with a garment you already love and our team will match the fit."
					}),
					/* @__PURE__ */ jsx("address", {
						className: "mt-7 not-italic text-sm leading-relaxed text-slate",
						children: formattedAddress
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(Button, {
							to: "/contact",
							children: "Contact us"
						}), /* @__PURE__ */ jsx(Button, {
							href: store.mapsUrl,
							target: "_blank",
							rel: "noreferrer noopener",
							variant: "outline",
							children: "Get directions"
						})]
					})
				] })]
			})
		})
	] });
}
//#endregion
//#region src/data/stores.js
/**
* Physical stores shown on the contact page / store locator.
* The first entry mirrors the flagship details in `config/store.js`.
*/
var storeLocations = [
	{
		name: `${store.storeName} Flagship`,
		city: store.address.city,
		address: `${store.address.line1}, ${store.address.line2}, ${store.address.city} ${store.address.pincode}`,
		phone: store.phone,
		hours: "Mon - Sat: 10:30 AM - 9:00 PM",
		mapsUrl: store.mapsUrl,
		isFlagship: true
	},
	{
		name: `${store.storeName} Bengaluru`,
		city: "Bengaluru",
		address: "18 Lavelle Road, Ashok Nagar, Bengaluru 560001",
		phone: "+91 98765 43211",
		hours: "Mon - Sun: 11:00 AM - 9:00 PM",
		mapsUrl: "https://maps.google.com/?q=Lavelle+Road+Bengaluru",
		isFlagship: false
	},
	{
		name: `${store.storeName} Coimbatore`,
		city: "Coimbatore",
		address: "7 Race Course Road, Coimbatore 641018",
		phone: "+91 98765 43212",
		hours: "Mon - Sat: 10:30 AM - 8:30 PM",
		mapsUrl: "https://maps.google.com/?q=Race+Course+Road+Coimbatore",
		isFlagship: false
	}
];
//#endregion
//#region src/pages/Contact.jsx
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var INITIAL = {
	name: "",
	email: "",
	phone: "",
	message: ""
};
function Contact() {
	const [form, setForm] = useState(INITIAL);
	const [errors, setErrors] = useState({});
	const [sent, setSent] = useState(false);
	const { toast } = useToast();
	const update = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({
			...current,
			[name]: value
		}));
		setErrors((current) => {
			if (!current[name]) return current;
			const next = { ...current };
			delete next[name];
			return next;
		});
	};
	const submit = (event) => {
		event.preventDefault();
		const next = {};
		if (form.name.trim().length < 2) next.name = "Please tell us your name.";
		if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "Enter a valid email address.";
		if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) next.phone = "Enter a valid 10 digit mobile number, or leave it blank.";
		if (form.message.trim().length < 10) next.message = "A little more detail helps us help you.";
		setErrors(next);
		if (Object.keys(next).length > 0) return;
		setSent(true);
		toast("Message sent", { description: "Our team replies within one working day." });
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Contact",
			description: `Visit the ${store.storeNamePlain} flagship store in ${store.address.city}, call ${store.phone} or send us a message. We reply within one working day.`
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				to: "/"
			}, { label: "Contact" }] })
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "shell pb-12 pt-7",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "eyebrow",
					children: "Get in touch"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "mt-5 max-w-2xl text-[2.6rem] leading-[1.02] sm:text-[3.4rem]",
					children: "We are here, and we actually reply."
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 max-w-xl text-base leading-relaxed text-slate",
					children: "Questions on sizing, fabric, an order or a bulk enquiry? Message us on WhatsApp for the fastest answer, or use the form below."
				})
			]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs("a", {
						href: whatsappLink(),
						target: "_blank",
						rel: "noreferrer noopener",
						className: "group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-11 w-11 shrink-0 items-center justify-center bg-[#1f8f5f]/10 text-[#1f8f5f]",
							children: /* @__PURE__ */ jsx(WhatsAppIcon, { size: 20 })
						}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
							className: "block text-[10px] uppercase tracking-[0.18em] text-muted",
							children: "WhatsApp"
						}), /* @__PURE__ */ jsx("span", {
							className: "mt-1 block text-sm text-ink",
							children: "Chat with a stylist"
						})] })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: telLink,
						className: "group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-11 w-11 shrink-0 items-center justify-center bg-clay/10 text-clay",
							children: /* @__PURE__ */ jsx(Phone, {
								size: 19,
								strokeWidth: 1.4
							})
						}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
							className: "block text-[10px] uppercase tracking-[0.18em] text-muted",
							children: "Call"
						}), /* @__PURE__ */ jsx("span", {
							className: "mt-1 block text-sm text-ink",
							children: store.phone
						})] })]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: mailtoLink,
						className: "group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-11 w-11 shrink-0 items-center justify-center bg-ink/5 text-ink",
							children: /* @__PURE__ */ jsx(Mail, {
								size: 19,
								strokeWidth: 1.4
							})
						}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
							className: "block text-[10px] uppercase tracking-[0.18em] text-muted",
							children: "Email"
						}), /* @__PURE__ */ jsx("span", {
							className: "mt-1 block truncate text-sm text-ink",
							children: store.email
						})] })]
					})
				]
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell py-16 lg:py-20",
			children: /* @__PURE__ */ jsxs("div", {
				className: "grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20",
				children: [/* @__PURE__ */ jsxs("section", {
					"aria-labelledby": "form-heading",
					children: [/* @__PURE__ */ jsx("h2", {
						id: "form-heading",
						className: "text-[11px] uppercase tracking-[0.24em] text-ink",
						children: "Send a message"
					}), sent ? /* @__PURE__ */ jsxs("div", {
						className: "mt-6 animate-fade-up border border-line bg-white px-6 py-10 text-center",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "inline-flex h-14 w-14 items-center justify-center rounded-full bg-clay/10 text-clay",
								children: /* @__PURE__ */ jsx(Send, {
									size: 22,
									strokeWidth: 1.3
								})
							}),
							/* @__PURE__ */ jsxs("h3", {
								className: "mt-6 text-2xl",
								children: [
									"Thank you, ",
									form.name.trim().split(" ")[0],
									"."
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate",
								children: "Your message is with our team. We reply to everything within one working day, and usually much sooner."
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-7 flex flex-wrap justify-center gap-3",
								children: [/* @__PURE__ */ jsx(Button, {
									to: "/shop",
									children: "Continue shopping"
								}), /* @__PURE__ */ jsx(Button, {
									variant: "outline",
									onClick: () => {
										setForm(INITIAL);
										setSent(false);
									},
									children: "Send another"
								})]
							})
						]
					}) : /* @__PURE__ */ jsxs("form", {
						onSubmit: submit,
						noValidate: true,
						className: "mt-6 space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ jsxs("div", { children: [
									/* @__PURE__ */ jsx("label", {
										htmlFor: "contact-name",
										className: "mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate",
										children: "Name"
									}),
									/* @__PURE__ */ jsx("input", {
										id: "contact-name",
										name: "name",
										value: form.name,
										onChange: update,
										"aria-invalid": Boolean(errors.name),
										className: "field",
										placeholder: "Your name",
										autoComplete: "name"
									}),
									errors.name && /* @__PURE__ */ jsx("p", {
										role: "alert",
										className: "mt-1.5 text-xs text-clay",
										children: errors.name
									})
								] }), /* @__PURE__ */ jsxs("div", { children: [
									/* @__PURE__ */ jsx("label", {
										htmlFor: "contact-email",
										className: "mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate",
										children: "Email"
									}),
									/* @__PURE__ */ jsx("input", {
										id: "contact-email",
										name: "email",
										type: "email",
										value: form.email,
										onChange: update,
										"aria-invalid": Boolean(errors.email),
										className: "field",
										placeholder: "you@email.com",
										autoComplete: "email"
									}),
									errors.email && /* @__PURE__ */ jsx("p", {
										role: "alert",
										className: "mt-1.5 text-xs text-clay",
										children: errors.email
									})
								] })]
							}),
							/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("label", {
									htmlFor: "contact-phone",
									className: "mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate",
									children: "Phone (optional)"
								}),
								/* @__PURE__ */ jsx("input", {
									id: "contact-phone",
									name: "phone",
									type: "tel",
									value: form.phone,
									onChange: update,
									"aria-invalid": Boolean(errors.phone),
									className: "field",
									placeholder: "98765 43210",
									inputMode: "numeric",
									maxLength: 10,
									autoComplete: "tel"
								}),
								errors.phone && /* @__PURE__ */ jsx("p", {
									role: "alert",
									className: "mt-1.5 text-xs text-clay",
									children: errors.phone
								})
							] }),
							/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("label", {
									htmlFor: "contact-message",
									className: "mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate",
									children: "Message"
								}),
								/* @__PURE__ */ jsx("textarea", {
									id: "contact-message",
									name: "message",
									rows: 5,
									value: form.message,
									onChange: update,
									"aria-invalid": Boolean(errors.message),
									className: "field resize-none",
									placeholder: "Tell us what you are looking for"
								}),
								errors.message && /* @__PURE__ */ jsx("p", {
									role: "alert",
									className: "mt-1.5 text-xs text-clay",
									children: errors.message
								})
							] }),
							/* @__PURE__ */ jsxs(Button, {
								type: "submit",
								size: "lg",
								className: "mt-2",
								children: ["Send Message", /* @__PURE__ */ jsx(Send, {
									size: 14,
									strokeWidth: 1.5
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-xs text-muted",
								children: "Demo form. Your details stay in the browser and are not transmitted anywhere."
							})
						]
					})]
				}), /* @__PURE__ */ jsxs("section", {
					"aria-labelledby": "details-heading",
					className: "lg:pl-4",
					children: [
						/* @__PURE__ */ jsx("h2", {
							id: "details-heading",
							className: "text-[11px] uppercase tracking-[0.24em] text-ink",
							children: "Flagship store"
						}),
						/* @__PURE__ */ jsxs("ul", {
							className: "mt-6 space-y-5 text-sm",
							children: [
								/* @__PURE__ */ jsxs("li", {
									className: "flex gap-4",
									children: [/* @__PURE__ */ jsx(MapPin, {
										size: 17,
										strokeWidth: 1.4,
										className: "mt-0.5 shrink-0 text-clay"
									}), /* @__PURE__ */ jsxs("span", { children: [
										/* @__PURE__ */ jsx("span", {
											className: "block text-[10px] uppercase tracking-[0.16em] text-muted",
											children: "Address"
										}),
										/* @__PURE__ */ jsx("address", {
											className: "mt-1.5 not-italic leading-relaxed text-slate",
											children: formattedAddress
										}),
										/* @__PURE__ */ jsxs("a", {
											href: store.mapsUrl,
											target: "_blank",
											rel: "noreferrer noopener",
											className: "mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline",
											children: [/* @__PURE__ */ jsx(Navigation, {
												size: 12,
												strokeWidth: 1.5
											}), "Get directions"]
										})
									] })]
								}),
								/* @__PURE__ */ jsxs("li", {
									className: "flex gap-4",
									children: [/* @__PURE__ */ jsx(Clock, {
										size: 17,
										strokeWidth: 1.4,
										className: "mt-0.5 shrink-0 text-clay"
									}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
										className: "block text-[10px] uppercase tracking-[0.16em] text-muted",
										children: "Opening hours"
									}), /* @__PURE__ */ jsx("dl", {
										className: "mt-1.5 space-y-1 text-slate",
										children: store.openingHours.map((entry) => /* @__PURE__ */ jsxs("div", {
											className: "flex flex-wrap gap-x-3",
											children: [/* @__PURE__ */ jsx("dt", {
												className: "min-w-36",
												children: entry.days
											}), /* @__PURE__ */ jsx("dd", {
												className: "text-ink",
												children: entry.hours
											})]
										}, entry.days))
									})] })]
								}),
								/* @__PURE__ */ jsxs("li", {
									className: "flex gap-4",
									children: [/* @__PURE__ */ jsx(Phone, {
										size: 17,
										strokeWidth: 1.4,
										className: "mt-0.5 shrink-0 text-clay"
									}), /* @__PURE__ */ jsxs("span", { children: [
										/* @__PURE__ */ jsx("span", {
											className: "block text-[10px] uppercase tracking-[0.16em] text-muted",
											children: "Phone and email"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "mt-1.5 block text-slate",
											children: /* @__PURE__ */ jsx("a", {
												href: telLink,
												className: "hover:text-ink",
												children: store.phone
											})
										}),
										/* @__PURE__ */ jsx("span", {
											className: "block text-slate",
											children: /* @__PURE__ */ jsx("a", {
												href: mailtoLink,
												className: "hover:text-ink",
												children: store.email
											})
										}),
										/* @__PURE__ */ jsxs("span", {
											className: "block text-slate",
											children: [
												/* @__PURE__ */ jsx("a", {
													href: `mailto:${store.supportEmail}`,
													className: "hover:text-ink",
													children: store.supportEmail
												}),
												" ",
												/* @__PURE__ */ jsx("span", {
													className: "text-muted",
													children: "(order support)"
												})
											]
										})
									] })]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-8 border border-line bg-sand/40 p-5",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "text-[10px] uppercase tracking-[0.18em] text-ink",
									children: "Wholesale and styling"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-sm leading-relaxed text-slate",
									children: "For bulk orders, wedding styling or press enquiries, WhatsApp us and we will set up a call within a day."
								}),
								/* @__PURE__ */ jsx(Button, {
									href: whatsappLink(`Hi ${store.storeNamePlain}, I would like to discuss a bulk or styling enquiry.`),
									target: "_blank",
									rel: "noreferrer noopener",
									variant: "outline",
									size: "sm",
									className: "mt-4",
									children: "Start a WhatsApp chat"
								})
							]
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			id: "stores",
			className: "scroll-mt-28 border-t border-line bg-sand/40",
			children: /* @__PURE__ */ jsxs("div", {
				className: "shell py-16 lg:py-20",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "eyebrow",
						children: "Store locator"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "mt-4 text-[2rem] sm:text-[2.5rem]",
						children: "Find us in person"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 max-w-lg text-sm leading-relaxed text-slate",
						children: "Three stores, the same collection, and complimentary alterations at every one."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: storeLocations.map((location) => /* @__PURE__ */ jsxs("div", {
							className: "flex flex-col border border-line bg-white p-6 transition-colors hover:border-ink/40",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ jsx("h3", {
										className: "font-display text-2xl text-ink",
										children: location.city
									}), location.isFlagship && /* @__PURE__ */ jsx("span", {
										className: "bg-ink px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-cream",
										children: "Flagship"
									})]
								}),
								/* @__PURE__ */ jsx("address", {
									className: "mt-3 flex-1 not-italic text-sm leading-relaxed text-slate",
									children: location.address
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-4 text-xs text-muted",
									children: location.hours
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-slate",
									children: location.phone
								}),
								/* @__PURE__ */ jsxs("a", {
									href: location.mapsUrl,
									target: "_blank",
									rel: "noreferrer noopener",
									className: "mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink underline-offset-4 transition-colors hover:text-clay hover:underline",
									children: [/* @__PURE__ */ jsx(Navigation, {
										size: 12,
										strokeWidth: 1.5
									}), "Directions"]
								})
							]
						}, location.name))
					})
				]
			})
		})
	] });
}
//#endregion
//#region src/pages/InfoPage.jsx
/** Renders the policy and help pages linked from the footer. */
function InfoPage() {
	const { slug } = useParams();
	const page = getInfoPage(slug);
	if (!page) return /* @__PURE__ */ jsx(Navigate, {
		to: "/not-found",
		replace: true
	});
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: page.title,
			description: page.intro
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pt-8",
			children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
				label: "Home",
				to: "/"
			}, { label: page.title }] })
		}),
		/* @__PURE__ */ jsx("div", {
			className: "shell pb-24 pt-7",
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "eyebrow",
						children: page.eyebrow
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "mt-5 text-[2.4rem] leading-[1.05] sm:text-[3.2rem]",
						children: page.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-6 text-base leading-relaxed text-slate",
						children: page.intro
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-12 space-y-10",
						children: page.sections.map((section) => /* @__PURE__ */ jsxs("section", { children: [
							/* @__PURE__ */ jsx("h2", {
								className: "font-display text-2xl text-ink sm:text-[1.75rem]",
								children: section.heading
							}),
							section.body && /* @__PURE__ */ jsx("ul", {
								className: "mt-4 space-y-2.5",
								children: section.body.map((line) => /* @__PURE__ */ jsxs("li", {
									className: "flex gap-3 text-sm leading-relaxed text-slate",
									children: [/* @__PURE__ */ jsx("span", {
										className: "mt-2 h-1 w-1 shrink-0 rounded-full bg-clay",
										"aria-hidden": "true"
									}), line]
								}, line))
							}),
							section.table && /* @__PURE__ */ jsx("div", {
								className: "mt-5 overflow-x-auto",
								children: /* @__PURE__ */ jsxs("table", {
									className: "w-full min-w-[24rem] border-collapse text-sm",
									children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
										className: "border-y border-line bg-sand/60 text-left",
										children: section.table.head.map((cell) => /* @__PURE__ */ jsx("th", {
											scope: "col",
											className: "px-3 py-2.5 text-[10px] font-normal uppercase tracking-[0.16em] text-slate",
											children: cell
										}, cell))
									}) }), /* @__PURE__ */ jsx("tbody", { children: section.table.rows.map((row) => /* @__PURE__ */ jsx("tr", {
										className: "border-b border-line/70",
										children: row.map((cell, index) => /* @__PURE__ */ jsx("td", {
											className: index === 0 ? "px-3 py-2.5 uppercase tracking-[0.08em] text-ink" : "px-3 py-2.5 tabular-nums text-slate",
											children: cell
										}, `${row[0]}-${index}`))
									}, row[0])) })]
								})
							})
						] }, section.heading))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-14 border-t border-line pt-8",
						children: [
							/* @__PURE__ */ jsx("h2", {
								className: "font-display text-2xl text-ink",
								children: "Still need a hand?"
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-3 text-sm leading-relaxed text-slate",
								children: [
									"Our team is on WhatsApp at ",
									store.phone,
									" and replies within a working day."
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-6 flex flex-wrap gap-3",
								children: [/* @__PURE__ */ jsx(Button, {
									href: whatsappLink(),
									target: "_blank",
									rel: "noreferrer noopener",
									children: "Message us"
								}), /* @__PURE__ */ jsx(Button, {
									to: "/contact",
									variant: "outline",
									children: "Contact page"
								})]
							})
						]
					})
				]
			})
		})
	] });
}
//#endregion
//#region src/pages/NotFound.jsx
function NotFound() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(PageMeta, {
			title: "Page not found",
			description: "The page you were looking for is no longer here. Browse the VERA collection instead."
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "shell py-24 text-center lg:py-32",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "eyebrow",
					children: "Error 404"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "mx-auto mt-6 max-w-2xl text-[2.6rem] leading-[1.02] sm:text-[3.6rem]",
					children: "This page has left the rail."
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mx-auto mt-5 max-w-md text-base leading-relaxed text-slate",
					children: "The link you followed is no longer available. The collection, however, is very much still here."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-9 flex flex-wrap justify-center gap-3",
					children: [/* @__PURE__ */ jsx(Button, {
						to: "/",
						children: "Back to home"
					}), /* @__PURE__ */ jsx(Button, {
						to: "/shop",
						variant: "outline",
						children: "Browse the shop"
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "shell pb-24",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "While you are here",
				title: "Best Sellers",
				align: "center",
				className: "mb-12"
			}), /* @__PURE__ */ jsx(ProductGrid, {
				products: bestSellers.slice(0, 4),
				columns: "four"
			})]
		})
	] });
}
//#endregion
//#region .check/ssr-entry.jsx
function Tree({ url }) {
	return /* @__PURE__ */ jsx(ToastProvider, { children: /* @__PURE__ */ jsx(CartProvider, { children: /* @__PURE__ */ jsx(WishlistProvider, { children: /* @__PURE__ */ jsx(UIProvider, { children: /* @__PURE__ */ jsxs(StaticRouter, {
		location: url,
		children: [
			/* @__PURE__ */ jsx(Navbar, {}),
			/* @__PURE__ */ jsxs(Routes, { children: [
				/* @__PURE__ */ jsx(Route, {
					path: "/",
					element: /* @__PURE__ */ jsx(Home, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/shop",
					element: /* @__PURE__ */ jsx(Shop, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/product/:id",
					element: /* @__PURE__ */ jsx(ProductDetails, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/cart",
					element: /* @__PURE__ */ jsx(Cart, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/wishlist",
					element: /* @__PURE__ */ jsx(Wishlist, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/checkout",
					element: /* @__PURE__ */ jsx(Checkout, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/about",
					element: /* @__PURE__ */ jsx(About, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/contact",
					element: /* @__PURE__ */ jsx(Contact, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/info/:slug",
					element: /* @__PURE__ */ jsx(InfoPage, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "*",
					element: /* @__PURE__ */ jsx(NotFound, {})
				})
			] }),
			/* @__PURE__ */ jsx(Footer, {})
		]
	}) }) }) }) });
}
function run() {
	const urls = [
		"/",
		"/shop",
		"/shop?gender=Women",
		"/shop?gender=Men&category=Shirts&size=M&price=1500-3000&sale=1&sort=price-asc",
		"/shop?tag=new",
		"/shop?tag=bestseller",
		"/shop?tag=sale",
		"/shop?q=dress",
		"/shop?q=zzzzzz",
		"/cart",
		"/wishlist",
		"/checkout",
		"/about",
		"/contact",
		"/nope-404",
		...infoPageSlugs.map((slug) => `/info/${slug}`),
		...products.map((product) => `/product/${product.id}`)
	];
	const failures = [];
	let imageUrls = /* @__PURE__ */ new Set();
	urls.forEach((url) => {
		try {
			const html = renderToString(/* @__PURE__ */ jsx(Tree, { url }));
			(html.match(/https:\/\/images\.unsplash\.com\/[^"'\s]+/g) || []).forEach((m) => imageUrls.add(m.replace(/&amp;/g, "&")));
			if (html.length < 500) failures.push(`${url} :: suspiciously short output`);
		} catch (error) {
			failures.push(`${url} :: ${error.message}`);
		}
	});
	return {
		total: urls.length,
		failures,
		imageUrls: [...imageUrls]
	};
}
//#endregion
export { products, run };
