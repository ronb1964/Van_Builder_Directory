# Product Requirements Document: Custom Camper Van Builder Directory

## 1. Executive Summary
This document outlines the requirements for a Software-as-a-Service (SaaS) web application designed as a public directory for custom camper van builders in the USA. The application will enable users to search for builders by state, zip code, or builder name, with results displayed in either a list view or map view. The app will be optimized for mobile devices and utilize a database to store authentic builder information, including name, address, contact details, social media links, van types, amenities, and up to 8 photos. The primary goal is to provide a user-friendly, publicly accessible platform for individuals seeking custom camper van builders.

## 2. Objectives
- Provide a searchable directory of authentic custom camper van builders in the USA.
- Enable users to search by state, zip code (with a default 100-mile radius), or builder name.
- Display results in list view (with cards) or map view (with cluster support).
- Ensure mobile optimization for seamless user experience across devices.
- Store and display detailed builder information, including a photo gallery, without using mock data.

## 3. Target Audience
- **Primary Audience**: General public, including individuals interested in custom camper vans, van life enthusiasts, and potential customers of camper van builders.
- **Accessibility**: Publicly accessible web application, no login required.

## 4. Functional Requirements

### 4.1 Search Functionality
- **Search Options**:
  - Search by **state** (dropdown menu with all US states).
  - Search by **zip code** (input field for 5-digit US zip codes, default 100-mile radius).
    - Include a range selector for zip code searches (e.g., 50, 100, 200 miles).
  - Search by **builder name** (text input with autocomplete suggestions).
- **Behavior**:
  - Search results update dynamically as users input or modify search criteria.
  - Zip code searches calculate and display the distance (in miles) from the entered zip code to each builder’s address.
  - All searches filter results from the database without relying on mock data.

### 4.2 Display Modes
- **List View**:
  - Display results as cards with the following information:
    - Builder name
    - City and state
    - Brief business overview (max 100 words)
    - Van types offered (e.g., Sprinter, Transit, Promaster)
    - Phone number (US format: (XXX) XXX-XXXX) or a disabled button with hover message “Contact via email” if no phone is available
    - Social media icons (linking to builder’s social media profiles)
    - “View Details” button
  - Cards are responsive and optimized for mobile devices.
- **Map View**:
  - Display builders as markers on an interactive map (e.g., using Google Maps or OpenStreetMap API).
  - Support marker clustering to prevent overlapping markers at high zoom levels.
  - Clicking a mileage badge in list view switches to map view, centering on the selected builder’s location.
  - Map is fully responsive for mobile devices.

### 4.3 Builder Details Page
- **Overview Tab**:
  - Builder name
  - Detailed business description (max 500 words)
  - Van types offered
  - Amenities provided (e.g., solar power, plumbing, custom cabinetry)
  - Contact information:
    - Phone number (US format) or “Contact via email” message if unavailable
    - Email address
    - Website URL
    - Social media links (e.g., Instagram, Facebook, YouTube)
  - Years of experience (if available)
- **Gallery Tab**:
  - Display up to 8 photos showcasing the builder’s work.
  - Photos are clickable to open in a lightbox for enlarged viewing.
  - Photos must be authentic, sourced directly from the builder (e.g., via their website or submissions).
  - Responsive gallery layout for mobile devices.

### 4.4 Database Structure
- **Fields**:
  - Builder Name (text, required)
  - Address (text, required for geolocation)
  - City (text, required)
  - State (text, required, US state abbreviation)
  - Zip Code (text, 5-digit, required)
  - Phone Number (text, US format, optional)
  - Email (text, required)
  - Website (text, optional)
  - Social Media Links (array of URLs, optional, e.g., Instagram, Facebook, Twitter, YouTube)
  - Van Types (array of text, required, e.g., Sprinter, Transit)
  - Amenities (array of text, required, e.g., solar power, kitchenette)
  - Years of Experience (integer, optional)
  - Photos (array of up to 8 image URLs, required, authentic images only)
- **Constraints**:
  - No mock data; all data must be authentic and sourced from builders.
  - Database supports geospatial queries for zip code searches (e.g., MongoDB with geospatial indexing or PostgreSQL with PostGIS).
  - Images stored in a cloud service (e.g., AWS S3) with URLs referenced in the database.

### 4.5 Mobile Optimization
- Responsive design using a framework like Tailwind CSS or Bootstrap.
- Touch-friendly interfaces (e.g., swipeable gallery, tappable map markers).
- Optimized image loading (e.g., lazy loading, compressed images).
- Search inputs and buttons sized for mobile usability.
- Map view supports pinch-to-zoom and drag gestures.

## 5. Non-Functional Requirements
- **Performance**:
  - Page load time < 2 seconds on average.
  - Search results return in < 1 second for up to 100 builders.
- **Scalability**:
  - Database and API should support up to 10,000 builders initially.
  - Cloud hosting (e.g., AWS, Google Cloud) for scalability.
- **Security**:
  - HTTPS for all connections.
  - Input validation to prevent SQL injection or XSS attacks.
  - Rate limiting on API endpoints to prevent abuse.
- **Accessibility**:
  - WCAG 2.1 compliance (Level AA) for screen readers and keyboard navigation.
  - High-contrast UI elements for readability.
- **Data Integrity**:
  - All builder data must be verified for authenticity (e.g., through manual submission or API integration with builder websites).
  - Regular data audits to ensure accuracy.

## 6. Technical Stack
- **Frontend**:
  - React with JSX for dynamic UI.
  - Tailwind CSS for responsive styling.
  - CDN-hosted React libraries (e.g., via cdn.jsdelivr.net).
  - Map library (e.g., Google Maps API or Leaflet for OpenStreetMap).
- **Backend**:
  - Node.js with Express for API.
  - Database: MongoDB (for geospatial queries) or PostgreSQL with PostGIS.
  - Cloud storage for images (e.g., AWS S3).
- **Hosting**:
  - Cloud provider (e.g., AWS, Google Cloud, or Vercel for frontend).
- **APIs**:
  - Geocoding API (e.g., Google Geocoding API) for zip code to coordinates conversion.
  - Map API for map view rendering.

## 7. User Interface
- **Homepage**:
  - Search bar with options for state, zip code, or builder name.
  - Toggle for list view/map view.
  - Brief introduction to the directory’s purpose.
- **List View**:
  - Grid of cards (2 columns on desktop, 1 on mobile).
  - Mileage badges on cards (for zip code searches) clickable to switch to map view.
- **Map View**:
  - Full-screen map with zoom controls and clustering.
  - Popups on markers showing builder name, city, state, and “View Details” link.
- **Details Page**:
  - Tabs for “Overview” and “Gallery”.
  - Responsive layout with side-by-side tabs on desktop, stacked on mobile.
  - Lightbox for enlarged photo viewing.

## 8. User Flow
1. User lands on the homepage and selects a search option (state, zip code, or builder name).
2. User adjusts the radius for zip code searches if desired (default 100 miles).
3. Results display in list view (default) or map view based on user preference.
4. In list view, user clicks “View Details” to see the builder’s overview or gallery.
5. In list view, user clicks a mileage badge to switch to map view, centered on the builder.
6. In map view, user clicks a marker to view basic info or navigate to the details page.
7. User can contact builders via phone, email, website, or social media links.

## 9. Assumptions
- Builders will provide authentic data through a submission form or API integration.
- Geocoding API will provide accurate coordinates for addresses and zip codes.
- Users have access to modern browsers (e.g., Chrome, Firefox, Safari) on desktop or mobile.
- No pricing information is required, as per user request.

## 10. Constraints
- No mock data can be used; all data must be authentic.
- Phone numbers must be in US format or omitted.
- Gallery limited to 8 photos per builder.
- Initial zip code search radius set to 100 miles, with adjustable options.

## 11. Future Enhancements
- User reviews and ratings for builders.
- Advanced filters (e.g., by amenities, van types, or years of experience).
- Builder submission portal for direct data entry.
- Offline caching for mobile users in low-connectivity areas.

## 12. Success Metrics
- **User Engagement**:
  - Average time spent on the site > 2 minutes.
  - >50% of users toggle between list and map views.
- **Search Usage**:
  - >70% of searches use zip code or state filters.
  - <5% of searches return no results.
- **Mobile Performance**:
  - >90% of mobile users report smooth navigation (via feedback form).
- **Data Integrity**:
  - 100% of builder data verified as authentic within 30 days of launch.

## 13. Timeline
- **Phase 1: Planning and Design** (4 weeks)
  - Finalize PRD and UI/UX wireframes.
  - Set up database schema and cloud infrastructure.
- **Phase 2: Development** (8 weeks)
  - Build frontend (React, Tailwind CSS, map integration).
  - Develop backend (Node.js, MongoDB/PostGIS, APIs).
  - Implement mobile optimization and accessibility.
- **Phase 3: Data Collection** (4 weeks)
  - Source authentic builder data (manual outreach or API).
  - Populate database and verify data integrity.
- **Phase 4: Testing and Launch** (4 weeks)
  - Conduct user testing and bug fixes.
  - Deploy to production and monitor performance.

## 14. Stakeholders
- **Product Owner**: Responsible for PRD and feature prioritization.
- **Developers**: Frontend and backend teams for implementation.
- **Data Team**: Responsible for sourcing and verifying builder data.
- **UI/UX Designer**: Designs wireframes and ensures mobile optimization.
- **Users**: General public seeking camper van builders.