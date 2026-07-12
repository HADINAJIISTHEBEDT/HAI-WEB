(function () {
  "use strict";

  var DEFAULT_SITE_DATA = {
    companyName: "HAI SOFTWARE INTELLIGENCE",
    tagline:
      "Engineering intelligent software, secure systems, and scalable digital products for modern businesses.",
    logoUrl:
      "file:///C:/Users/Iman/.cursor/projects/c-Users-Iman-Desktop-HAI-WEB/assets/c__Users_Iman_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_MAIN_LOGO-3e04551a-fcf0-485a-978a-d660bdb36508.png",
    heroImageUrl:
      "file:///C:/Users/Iman/.cursor/projects/c-Users-Iman-Desktop-HAI-WEB/assets/c__Users_Iman_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_WEB_PHOTO-bd44f135-42ae-43a1-8f43-46bab8306f23.png",
    primaryColor: "#1e72ff",
    defaultLanguage: "en",
    textOverrides: {},
    badges: [
      { id: "b1", text: "Code" },
      { id: "b2", text: "Develop" },
      { id: "b3", text: "Solve" },
      { id: "b4", text: "Innovate" },
      { id: "b5", text: "Secure" },
      { id: "b6", text: "Grow" }
    ],
    heroCtas: [
      { id: "cta1", label: "Contact Us", href: "#contact", style: "primary" },
      { id: "cta2", label: "About Us", href: "#about", style: "soft" }
    ],
    contactBlock: {
      enabled: true,
      title: "Send a Message",
      description: "Tell us about your project and we will get back to you.",
      buttonText: "Send Message"
    },
    newsletterBlock: {
      enabled: true,
      title: "Stay Updated",
      description: "Get product updates and software insights from HAI.",
      buttonText: "Subscribe",
      placeholder: "your@email.com"
    },
    footerLinks: [
      { id: "f1", label: "About Us", href: "#about" },
      { id: "f2", label: "Services", href: "#services" },
      { id: "f3", label: "Contact Us", href: "#contact" }
    ],
    footerOrder: ["brand", "links", "social"],
    socialLinks: [
      { id: "s1", platform: "youtube", label: "YouTube", url: "https://youtube.com", enabled: true },
      { id: "s2", platform: "instagram", label: "Instagram", url: "https://instagram.com", enabled: true },
      { id: "s3", platform: "facebook", label: "Facebook", url: "https://facebook.com", enabled: true }
    ],
    translations: {
      en: {
        companyName: "HAI SOFTWARE INTELLIGENCE",
        tagline:
          "Engineering intelligent software, secure systems, and scalable digital products for modern businesses.",
        badges: ["Code", "Develop", "Solve", "Innovate", "Secure", "Grow"],
        ui: {
          openLink: "Open Link",
          adminPanel: "Admin Panel",
          allRightsReserved: "All rights reserved.",
          videoUrlLabel: "Video URL:",
          sectionsMenu: "Sections"
        }
      },
      ar: {
        companyName: "HAI SOFTWARE INTELLIGENCE",
        tagline:
          "نطوّر برمجيات ذكية وأنظمة آمنة ومنتجات رقمية قابلة للتوسع للشركات الحديثة.",
        badges: ["برمجيات", "تطوير", "حلول", "ابتكار", "أمان", "نمو"],
        ui: {
          openLink: "فتح الرابط",
          adminPanel: "لوحة الإدارة",
          allRightsReserved: "جميع الحقوق محفوظة.",
          videoUrlLabel: "رابط الفيديو:",
          sectionsMenu: "الأقسام"
        }
      }
    },
    sections: [
      {
        id: "about",
        type: "about",
        title: "About Us",
        description:
          "HAI SOFTWARE INTELLIGENCE is a software company focused on intelligent web platforms, business automation, and reliable system architecture. We help organizations move from idea to production with practical AI and strong engineering standards.",
        enabled: true,
        items: [
          {
            title: "Our Mission",
            description:
              "Deliver powerful and easy-to-use software solutions that improve productivity and create measurable business value.",
            url: ""
          },
          {
            title: "Our Vision",
            description:
              "Become a trusted global partner for intelligent software transformation and innovation.",
            url: ""
          },
          {
            title: "Core Values",
            description:
              "Quality, security, speed, transparency, and long-term partnership.",
            url: ""
          }
        ]
      },
      {
        id: "services",
        type: "services",
        title: "Our Services",
        description:
          "From planning to deployment and growth, we provide complete software services.",
        enabled: true,
        items: [
          {
            title: "Web Development",
            description:
              "Custom responsive websites, dashboards, portals, and full-stack web applications.",
            url: ""
          },
          {
            title: "AI Integration",
            description:
              "Integrate machine intelligence into operations, support systems, and business analytics.",
            url: ""
          },
          {
            title: "System Optimization",
            description:
              "Performance tuning, scaling architecture, and reliability improvements for existing systems.",
            url: ""
          },
          {
            title: "Cloud & DevOps",
            description:
              "Cloud deployment pipelines, monitoring, CI/CD, and infrastructure best practices.",
            url: ""
          },
          {
            title: "Security Engineering",
            description:
              "Secure coding, access controls, and architecture hardening for business-critical apps.",
            url: ""
          }
        ]
      },
      {
        id: "solutions",
        type: "custom",
        title: "Industries & Solutions",
        description:
          "We build tailored software products for different sectors and operating models.",
        enabled: true,
        items: [
          {
            title: "Enterprise Operations",
            description:
              "Internal systems for workflow management, approvals, task automation, and reporting.",
            url: ""
          },
          {
            title: "Education & Training",
            description:
              "Learning portals, progress dashboards, content systems, and communication tools.",
            url: ""
          },
          {
            title: "E-commerce & Retail",
            description:
              "Smart storefronts, product management systems, and customer engagement features.",
            url: ""
          },
          {
            title: "Professional Services",
            description:
              "Client portals, booking systems, service tracking, and digital business workflows.",
            url: ""
          }
        ]
      },
      {
        id: "apps",
        type: "apps",
        title: "Apps & Products",
        description:
          "A growing portfolio of software products developed by HAI SOFTWARE INTELLIGENCE.",
        enabled: true,
        items: [
          {
            title: "HAI Business Suite",
            description:
              "A modular business platform for CRM, operations, and team collaboration.",
            url: "#"
          },
          {
            title: "HAI Insight Analytics",
            description:
              "A reporting and intelligence dashboard for KPIs, trends, and executive decisions.",
            url: "#"
          },
          {
            title: "HAI Support Assistant",
            description:
              "AI-assisted support workflow system for faster response and better customer satisfaction.",
            url: "#"
          }
        ]
      },
      {
        id: "links",
        type: "links",
        title: "Useful Links",
        description: "Official links, resources, and communication channels.",
        enabled: true,
        items: [
          {
            title: "Official Website",
            description: "Main company website and product showcase.",
            url: "https://example.com"
          },
          {
            title: "Company LinkedIn",
            description: "Professional company updates and announcements.",
            url: "https://www.linkedin.com/company"
          },
          {
            title: "Contact Email",
            description: "Reach our business and technical team directly.",
            url: "mailto:contact@haisoftware.com"
          },
          {
            title: "Schedule a Meeting",
            description: "Book a project discovery call with our team.",
            url: "https://calendly.com"
          }
        ]
      },
      {
        id: "videos",
        type: "videos",
        title: "Videos",
        description:
          "Company profile videos, product demos, tutorials, and client showcases.",
        enabled: true,
        items: [
          {
            title: "HAI Company Introduction",
            description:
              "A short overview of our mission, services, and software capabilities.",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          },
          {
            title: "Product Demo",
            description:
              "Walkthrough of a typical HAI software product and feature highlights.",
            videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw"
          },
          {
            title: "Client Success Story",
            description:
              "Sample case study showing project impact and business improvements.",
            videoUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ"
          }
        ]
      },
      {
        id: "process",
        type: "custom",
        title: "How We Work",
        description:
          "Our delivery process is structured for speed, quality, and transparency.",
        enabled: true,
        items: [
          {
            title: "1. Discovery",
            description:
              "Understand goals, users, technical requirements, and business priorities.",
            url: ""
          },
          {
            title: "2. Planning & Design",
            description:
              "Define architecture, milestones, UX direction, and implementation roadmap.",
            url: ""
          },
          {
            title: "3. Development",
            description:
              "Build iteratively with continuous testing, reviews, and communication.",
            url: ""
          },
          {
            title: "4. Launch & Support",
            description:
              "Deploy, monitor, optimize, and support your platform after release.",
            url: ""
          }
        ]
      },
      {
        id: "tech-stack",
        type: "custom",
        title: "Technology Stack",
        description:
          "We use reliable modern technologies for front-end, back-end, data, and cloud.",
        enabled: true,
        items: [
          {
            title: "Frontend",
            description:
              "HTML, CSS, JavaScript, TypeScript, React, and modern UI frameworks.",
            url: ""
          },
          {
            title: "Backend",
            description:
              "Node.js, Python, REST APIs, authentication systems, and scalable services.",
            url: ""
          },
          {
            title: "Data & AI",
            description:
              "Firestore, SQL databases, analytics pipelines, and AI model integrations.",
            url: ""
          },
          {
            title: "Cloud & Hosting",
            description:
              "Firebase, cloud hosting, CDN delivery, and secure deployment workflows.",
            url: ""
          }
        ]
      },
      {
        id: "faq",
        type: "custom",
        title: "Frequently Asked Questions",
        description:
          "Answers to common questions about our services, timelines, and collaboration.",
        enabled: true,
        items: [
          {
            title: "How long does a project take?",
            description:
              "Project timelines depend on complexity; small websites can launch in weeks, larger platforms in phases.",
            url: ""
          },
          {
            title: "Do you provide maintenance after launch?",
            description:
              "Yes. We provide support, updates, monitoring, and feature expansion plans.",
            url: ""
          },
          {
            title: "Can we request custom features later?",
            description:
              "Absolutely. The platform is built to evolve, and your admin workflow already supports content expansion.",
            url: ""
          }
        ]
      },
      {
        id: "team",
        type: "custom",
        title: "Our Team",
        description:
          "A multidisciplinary team of engineers, designers, and product specialists.",
        enabled: true,
        items: [
          {
            title: "Hadi Naji - Founder & CEO",
            description:
              "Leads company strategy, product direction, and innovation initiatives.",
            url: ""
          },
          {
            title: "Engineering Team",
            description:
              "Builds secure, high-performance platforms with modern software architecture.",
            url: ""
          },
          {
            title: "Design & UX Team",
            description:
              "Designs user-friendly interfaces and smooth digital experiences.",
            url: ""
          },
          {
            title: "Delivery & Support Team",
            description:
              "Ensures fast execution, reliable deployment, and continuous post-launch support.",
            url: ""
          }
        ]
      },
      {
        id: "portfolio",
        type: "custom",
        title: "Portfolio / Projects",
        description:
          "Selected software projects and business solutions delivered by our team.",
        enabled: true,
        items: [
          {
            title: "Enterprise Management Portal",
            description:
              "Centralized workflow, approvals, and reporting platform for internal operations.",
            url: "#"
          },
          {
            title: "Smart Client Dashboard",
            description:
              "Real-time analytics and performance dashboard for service businesses.",
            url: "#"
          },
          {
            title: "Digital Service Platform",
            description:
              "Online booking, account management, and communication suite.",
            url: "#"
          }
        ]
      },
      {
        id: "testimonials",
        type: "custom",
        title: "Client Testimonials",
        description:
          "What clients say about working with HAI SOFTWARE INTELLIGENCE.",
        enabled: true,
        items: [
          {
            title: "Operations Director - Retail Company",
            description:
              "The HAI team transformed our workflow with a reliable system that saved hours every week.",
            url: ""
          },
          {
            title: "CEO - Professional Services Firm",
            description:
              "Excellent communication, fast delivery, and real technical depth from start to finish.",
            url: ""
          },
          {
            title: "Product Manager - Startup",
            description:
              "They built a scalable foundation that allowed us to launch quickly and grow with confidence.",
            url: ""
          }
        ]
      },
      {
        id: "pricing",
        type: "custom",
        title: "Pricing / Plans",
        description:
          "Flexible engagement models for startups, SMEs, and enterprise clients.",
        enabled: true,
        items: [
          {
            title: "Starter Plan",
            description:
              "Landing pages, small business websites, and essential integrations. Ideal for early-stage teams.",
            url: "#"
          },
          {
            title: "Business Plan",
            description:
              "Full web applications, admin systems, and structured support for growing companies.",
            url: "#"
          },
          {
            title: "Enterprise Plan",
            description:
              "Custom architecture, advanced security, automation, and dedicated long-term partnership.",
            url: "#"
          }
        ]
      },
      {
        id: "contact",
        type: "contact",
        title: "Contact",
        description:
          "Email: contact@haisoftware.com | Phone: +961 00 000 000 | Address: Lebanon (Update in Admin)",
        enabled: true,
        items: [
          {
            title: "Business Inquiries",
            description:
              "For new projects, partnerships, and proposals.",
            url: "mailto:business@haisoftware.com"
          },
          {
            title: "Technical Support",
            description:
              "For product support, issue reporting, and maintenance requests.",
            url: "mailto:support@haisoftware.com"
          },
          {
            title: "Working Hours",
            description:
              "Sunday - Thursday, 9:00 AM to 6:00 PM (UTC+3).",
            url: ""
          }
        ]
      }
    ]
  };

  function createId(prefix) {
    return (prefix || "section") + "-" + Math.random().toString(36).slice(2, 10);
  }

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function mergeItem(item) {
    var next = Object.assign({}, item || {});
    next.title = next.title || "Item";
    next.description = next.description || "";
    next.url = next.url || "";
    next.videoUrl = next.videoUrl || "";
    next.imageUrl = next.imageUrl || "";
    next.actionType = next.actionType || "none";
    next.actionLabel = next.actionLabel || "Open";
    next.i18n = next.i18n && typeof next.i18n === "object" ? next.i18n : {};
    return next;
  }

  function mergeSection(section) {
    var next = Object.assign({}, section || {});
    next.id = next.id || createId("section");
    next.type = next.type || "custom";
    next.title = next.title || "New Section";
    next.description = next.description || "";
    next.enabled = next.enabled !== false;
    next.items = Array.isArray(next.items) ? next.items.map(mergeItem) : [];
    next.buttons = Array.isArray(next.buttons) ? next.buttons.map(mergeCta) : [];
    next.imageUrl = (next && next.imageUrl) || "";
    next.i18n = next.i18n && typeof next.i18n === "object" ? next.i18n : {};
    return next;
  }

  function mergeBadge(item) {
    return {
      id: (item && item.id) || createId("badge"),
      text: (item && (item.text || item)) || "Badge"
    };
  }

  function mergeCta(item) {
    return {
      id: (item && item.id) || createId("cta"),
      label: (item && item.label) || "Button",
      href: (item && item.href) || "#",
      style: (item && item.style) || "primary"
    };
  }

  function mergeFooterLink(item) {
    return {
      id: (item && item.id) || createId("flink"),
      label: (item && item.label) || "Link",
      href: (item && item.href) || "#"
    };
  }

  function mergeSocial(item) {
    return {
      id: (item && item.id) || createId("social"),
      platform: (item && item.platform) || "youtube",
      label: (item && item.label) || "Social",
      url: (item && item.url) || "",
      enabled: !item || item.enabled !== false
    };
  }

  function normalizeData(data) {
    var base = clone(DEFAULT_SITE_DATA);
    if (!data || typeof data !== "object") {
      return base;
    }

    base.companyName = data.companyName || base.companyName;
    base.tagline = data.tagline || base.tagline;
    base.logoUrl = data.logoUrl || base.logoUrl;
    base.heroImageUrl = data.heroImageUrl || base.heroImageUrl;
    base.primaryColor = data.primaryColor || base.primaryColor;
    base.defaultLanguage =
      data.defaultLanguage === "ar" || data.defaultLanguage === "en"
        ? data.defaultLanguage
        : base.defaultLanguage;
    base.translations =
      data.translations && typeof data.translations === "object"
        ? {
            en: data.translations.en || base.translations.en,
            ar: data.translations.ar || base.translations.ar
          }
        : base.translations;
    base.sections = Array.isArray(data.sections)
      ? data.sections.map(mergeSection)
      : base.sections;
    base.badges = Array.isArray(data.badges) ? data.badges.map(mergeBadge) : base.badges;
    base.heroCtas = Array.isArray(data.heroCtas) ? data.heroCtas.map(mergeCta) : base.heroCtas;
    base.footerLinks = Array.isArray(data.footerLinks)
      ? data.footerLinks.map(mergeFooterLink)
      : base.footerLinks;
    base.footerOrder = Array.isArray(data.footerOrder) && data.footerOrder.length
      ? data.footerOrder.filter(function (key) {
          return key === "brand" || key === "links" || key === "social";
        })
      : ["brand", "links", "social"];
    if (base.footerOrder.indexOf("brand") < 0) base.footerOrder.unshift("brand");
    if (base.footerOrder.indexOf("links") < 0) base.footerOrder.push("links");
    if (base.footerOrder.indexOf("social") < 0) base.footerOrder.push("social");
    base.socialLinks = Array.isArray(data.socialLinks)
      ? data.socialLinks.map(mergeSocial)
      : base.socialLinks;
    base.textOverrides =
      data.textOverrides && typeof data.textOverrides === "object" ? data.textOverrides : {};
    base.contactBlock = Object.assign({}, base.contactBlock, data.contactBlock || {});
    base.newsletterBlock = Object.assign({}, base.newsletterBlock, data.newsletterBlock || {});

    return base;
  }

  window.HaiSiteData = {
    DEFAULT_SITE_DATA: clone(DEFAULT_SITE_DATA),
    createId: createId,
    clone: clone,
    normalize: normalizeData
  };
})();
