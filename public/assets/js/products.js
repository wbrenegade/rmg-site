const PRODUCTS = [
    {
        "id":  "rmg-windshield-banner",
        "name":  "Custom Windshield Banner",
        "slug":  "custom-windshield-banner",
        "category":  "Decals",
        "subcategory":  "Windshield/Rear Window Banners",
        "subSubcategory":  null,
        "price":  39.99,
        "tags":  [
                     "Decals",
                     "Windshield/Rear Window Banners"
                 ],
        "imagePath":  "/assets/imgs/product-cards/windshield_banner.png",
        "imageLabel":  "Windshield Banner Preview",
        "description":  "Aggressive custom windshield banner in your choice of text and color.",
        "customizeUrl":  "/windshield-banner-creator?productId=rmg-windshield-banner",
        "featured":  true,
        "custom":  true
    },
    {
        "id":  "rmg-custom-banner",
        "name":  "Custom Banner Design",
        "slug":  "custom-banner-design",
        "category":  "Decals",
        "subcategory":  "Windshield/Rear Window Banners",
        "subSubcategory":  null,
        "price":  59.99,
        "tags":  [
                     "Decals",
                     "Windshield/Rear Window Banners",
                     "Custom"
                 ],
        "imagePath":  "/assets/imgs/decals/products/custom/custom-banner.png",
        "imageLabel":  "Custom Banner Preview",
        "description":  "Fully custom windshield or rear window banner design with your text, color, and spacing dialed in before production.",
        "customizeUrl":  "/windshield-banner-creator?productId=rmg-custom-banner",
        "customizeCtaLabel":  "Customize Now",
        "featured":  false,
        "custom":  true
    },
    {
        "id":  "rmg-quarter-panel-kit",
        "name":  "Mustang Rear Quarter Panel Kit",
        "slug":  "mustang-rear-quarter-panel-kit",
        "category":  "Decals",
        "subcategory":  "Rear Quarter Panel",
        "subSubcategory":  "Graphics",
        "price":  74.99,
        "tags":  [
                     "Decals",
                     "Rear Quarter Panel",
                     "Graphics"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Quarter Panel Graphic",
        "description":  "Rear quarter panel kit with pre-sized placement for late-model Mustang builds.",
        "featured":  true,
        "custom":  false
    },
    {
        "id":  "rmg-sponsor-stack-set",
        "name":  "Track Sponsor Stack Set",
        "slug":  "track-sponsor-stack-set",
        "category":  "Decals",
        "subcategory":  "Fender",
        "subSubcategory":  "Sponsor Stacks",
        "price":  34.99,
        "tags":  [
                     "Decals",
                     "Fender",
                     "Sponsor Stacks"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Sponsor Stack Set",
        "description":  "Ready-to-apply sponsor stack bundle for doors and quarter windows.",
        "featured":  true,
        "custom":  false
    },
    {
        "id":  "rmg-rear-window-banner-kit",
        "name":  "Rear Window Banner Kit",
        "slug":  "rear-window-banner-kit",
        "category":  "Decals",
        "subcategory":  "Windshield/Rear Window Banners",
        "subSubcategory":  null,
        "price":  44.99,
        "tags":  [
                     "Decals",
                     "Windshield/Rear Window Banners"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Rear Window Banner",
        "description":  "Rear window banner package sized for modern coupe and sedan back glass.",
        "featured":  false,
        "custom":  false
    },
    {
        "id":  "rmg-racing-stripes-kit",
        "name":  "Dual Racing Stripe Kit",
        "slug":  "dual-racing-stripe-kit",
        "category":  "Decals",
        "subcategory":  "Full Body/Half Body",
        "subSubcategory":  "Racing Stripes",
        "price":  89.99,
        "tags":  [
                     "Decals",
                     "Full Body/Half Body",
                     "Racing Stripes"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Racing Stripe Kit",
        "description":  "Center stripe kit for hood, roof, and trunk with pre-matched widths.",
        "stripeOptions": {
            "widths": [
                "8 in / 8 in",
                "10 in / 10 in",
                "12 in / 12 in",
                "10 in center + 2 in pinstripes"
            ],
            "colors": [
                "Gloss Black",
                "Matte Black",
                "Satin Charcoal",
                "Gloss White",
                "Race Red",
                "Nardo Gray"
            ]
        },
        "featured":  false,
        "custom":  false
    },
    {
        "id":  "rmg-business-door-lettering",
        "name":  "Business Door Lettering Set",
        "slug":  "business-door-lettering-set",
        "category":  "Lettering",
        "subcategory":  "Business Info",
        "subSubcategory":  null,
        "price":  64.99,
        "tags":  [
                     "Lettering",
                     "Business Info"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Business Door Lettering",
        "description":  "Clean vinyl lettering for your business hours, phone number, and service details.",
        "featured":  true,
        "custom":  false
    },
    {
        "id":  "rmg-rocker-stripe",
        "name":  "Rocker Panel Kit",
        "slug":  "rocker-panel-kit",
        "category":  "Decals",
        "subcategory":  "Rocker Panel/Side",
        "subSubcategory":  "Racing Stripes",
        "price":  59.99,
        "tags":  [
                     "Decals",
                     "Rocker Panel/Side",
                     "Racing Stripes"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Rocker Stripe Set",
        "description":  "Long rocker panel graphics with side-specific cuts and alignment marks.",
        "stripeOptions": {
            "widths": [
                "3 in",
                "4 in",
                "5 in",
                "6 in"
            ],
            "colors": [
                "Gloss Black",
                "Matte Black",
                "Satin Charcoal",
                "Gloss White",
                "Race Red",
                "Nardo Gray"
            ]
        },
        "featured":  false,
        "custom":  false
    },
    {
        "id":  "rmg-claw-mark-kit",
        "name":  "Single Decal Lightning Pack",
        "slug":  "single-decal-lightning-pack",
        "category":  "Decals",
        "subcategory":  "Platform Specific",
        "subSubcategory":  "Graphics",
        "price":  24.99,
        "tags":  [
                     "Decals",
                     "Platform Specific",
                     "Graphics"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Single Decal Pack",
        "description":  "Single-hit decal set for fenders, windows, tailgates, and helmets.",
        "featured":  false,
        "custom":  false
    },
    {
        "id":  "rmg-custom-sponsor-stack",
        "name":  "Custom Sponsor Stack Layout",
        "slug":  "custom-sponsor-stack-layout",
        "category":  "Decals",
        "subcategory":  "Fender",
        "subSubcategory":  "Sponsor Stacks",
        "price":  119.99,
        "tags":  [
                     "Decals",
                     "Fender",
                     "Sponsor Stacks"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Custom Sponsor Stack",
        "description":  "Full custom sponsor-stack design with your logos, classes, and branding.",
        "featured":  false,
        "custom":  true
    },
    {
        "id":  "rmg-custom-racing-stripes",
        "name":  "Custom Racing Stripe Design",
        "slug":  "custom-racing-stripe-design",
        "category":  "Decals",
        "subcategory":  "Full Body/Half Body",
        "subSubcategory":  "Racing Stripes",
        "price":  149.99,
        "tags":  [
                     "Decals",
                     "Full Body/Half Body",
                     "Racing Stripes"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Custom Racing Stripe",
        "description":  "Custom stripe concept built around your exact vehicle and visual style.",
        "featured":  false,
        "custom":  true
    },
    {
        "id":  "rmg-custom-quarter-kit",
        "name":  "Custom Rear Quarter Panel Layout",
        "slug":  "custom-rear-quarter-panel-layout",
        "category":  "Decals",
        "subcategory":  "Rear Quarter Panel",
        "subSubcategory":  "Graphics",
        "price":  129.99,
        "tags":  [
                     "Decals",
                     "Rear Quarter Panel",
                     "Graphics"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Custom Quarter Panel Layout",
        "description":  "Custom quarter panel concept matched to your selected body style and wheelbase.",
        "featured":  false,
        "custom":  true
    },
    {
        "id":  "rmg-custom-rocker-panel",
        "name":  "Custom Rocker Panel Kit",
        "slug":  "custom-rocker-panel-kit",
        "category":  "Decals",
        "subcategory":  "Rocker Panel/Side",
        "subSubcategory":  "Brands",
        "price":  139.99,
        "tags":  [
                     "Decals",
                     "Rocker Panel/Side",
                     "Brands"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Custom Rocker Panel Kit",
        "description":  "Tailored rocker panel graphics with custom shape, line weight, and spacing.",
        "featured":  false,
        "custom":  true
    },
    {
        "id":  "rmg-custom-single-decals",
        "name":  "Custom Single Decal Design",
        "slug":  "custom-single-decal-design",
        "category":  "Decals",
        "subcategory":  "Custom",
        "subSubcategory":  null,
        "price":  79.99,
        "tags":  [
                     "Decals",
                     "Custom"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Custom Single Decal",
        "description":  "One-off custom decal design package for logos, scripts, and motif art.",
        "featured":  false,
        "custom":  true
    },
    {
        "id":  "rmg-logo-sticker-pack",
        "name":  "Logo Sticker Pack",
        "slug":  "logo-sticker-pack",
        "category":  "Decals",
        "subcategory":  "Platform Specific",
        "subSubcategory":  "Graphics",
        "price":  14.99,
        "tags":  [
                     "Decals",
                     "Platform Specific",
                     "Graphics"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Logo Sticker Pack",
        "description":  "Pack of premium cut stickers for windows, toolboxes, laptops, and more.",
        "featured":  false,
        "custom":  false
    },
    {
        "id":  "rmg-service-truck-branding",
        "name":  "Service Truck Branding Kit",
        "slug":  "service-truck-branding-kit",
        "category":  "Lettering",
        "subcategory":  "Business Name",
        "subSubcategory":  null,
        "price":  129.99,
        "tags":  [
                     "Lettering",
                     "Business Name"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Service Truck Branding",
        "description":  "Add your company name, phone number, services, and simple branding to your work truck.",
        "featured":  false,
        "custom":  false
    },
    {
        "id":  "rmg-custom-order",
        "name":  "Custom Graphic Order",
        "slug":  "custom-graphic-order",
        "category":  "Wraps",
        "subcategory":  "By The Foot",
        "subSubcategory":  null,
        "price":  99.99,
        "tags":  [
                     "Wraps",
                     "By The Foot"
                 ],
        "imagePath":  "/assets/imgs/main.PNG",
        "imageLabel":  "Custom Graphic Order",
        "description":  "A starting package for fully custom artwork and production planning.",
        "featured":  false,
        "custom":  true
    }
];

