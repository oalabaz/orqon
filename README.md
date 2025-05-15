# Orqon Personal Website

A personal portfolio website for Orkun Alabaz (Orqon).

## Project Structure

The website is built with a modular approach where each section is separated into its own HTML file for easier maintenance and updates.

### Main Files

- `index.php` - The main PHP version of the site that uses PHP includes to load sections
- `index-js.html` - Alternative HTML version that uses JavaScript to dynamically load sections
- `index.html` - Original monolithic version (kept for reference)

### Sections

All individual sections are stored in the `/sections/` directory:

- `introduction.html` - Homepage/intro section
- `about.html` - About me section
- `achievements.html` - Proficiencies and achievements section
- `services.html` - Services offered section
- `resume.html` - Professional experience section
- `skills.html` - Skills section with progress bars
- `portfolio.html` - Portfolio items gallery
- `recent-projects.html` - Detailed recent projects section with links
- `customers.html` - Client logos section
- `testimonials.html` - Client testimonials section
- `faq.html` - Frequently asked questions
- `contact.html` - Contact information section

### Assets

- `/assets/css/` - Stylesheet files
- `/assets/js/` - JavaScript files including the `section-loader.js` used for loading sections dynamically
- `/assets/images/` - Images used throughout the site
- `/assets/fonts/` - Custom fonts

## How to Make Changes

### Option 1: PHP Version (Preferred if using PHP server)

Edit the individual section files in the `/sections/` directory. The changes will be automatically reflected when the page is loaded via PHP.

### Option 2: JavaScript Version (For static hosting)

Edit the individual section files in the `/sections/` directory. The JavaScript will load these files dynamically when the page loads.

### Adding New Sections

1. Create a new HTML file in the `/sections/` directory
2. Add the section to the appropriate location in either `index.php` or `index-js.html`

## Technical Details

### PHP Version
The PHP version uses simple `include` statements to load each section:

```php
<?php include 'sections/introduction.html'; ?>
```

### JavaScript Version
The JavaScript version uses fetch API to load sections dynamically:

```javascript
async function loadSections() {
    for (const sectionFile of sectionFiles) {
        const response = await fetch(sectionFile);
        const html = await response.text();
        // Add section to the page
    }
}
```

## Running the Project

### PHP Version
Requires a PHP server. You can use tools like XAMPP, WAMP, or any PHP-compatible web server.

### JavaScript Version
Can be run on any web server or even as a static site on hosting providers like GitHub Pages, Netlify, etc.
