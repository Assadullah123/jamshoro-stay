# Jamshoro Stay

Build a clean, modern, mobile-first web application called "Jamshoro Student Housing & Hostel Finder" for students attending University of Sindh (UoS), MUET, and LUMHS in Jamshoro/Kotri.

The platform should allow students to discover hostels, rooms, and shared accommodations, while allowing hostel operators/landlords and students looking for roommates to create and manage their own listings.

The application should feel trustworthy, fast, simple, and optimized for mobile users.

1. User Roles & Authentication

Support three user types:

Student

Students can:

Create an account and log in.

Browse hostel/accommodation listings.

Search and filter listings.

View listing details and photos.

Contact owners/operators through phone or WhatsApp.

Create a "Roommate Wanted" or shared-room listing.

Edit/delete their own listings.

Hostel Operator / Landlord

Operators can:

Create an account and log in.

Create hostel/property listings.

Upload multiple photos.

Add multiple contact numbers.

Specify amenities, rent, room configuration, gender, and location.

Edit/delete their own listings.

View their active listings.

Admin

Create a simple admin dashboard where administrators can:

View all users.

View all listings.

Approve/reject listings.

Remove inappropriate or spam listings.

Manage reported listings.

Feature selected listings if desired.

Listings should preferably have a moderation status such as:
Pending / Approved / Rejected.

Only approved listings should appear publicly.

2. Landing Page — Immediate Gender Separation

The home page should immediately present a prominent choice:

Find Boys' Accommodation

Find Girls' Accommodation

This gender selection should be visually obvious and accessible before users begin browsing.

Below it, provide a large smart search bar:

"Search by campus or nearby area..."

Suggested search options:

Campuses

University of Sindh (UoS)

MUET

LUMHS

Areas / Landmarks

Jamshoro Phatak

Kotri

Phase 1

Phase 2

Users should also be able to type a free-text search.

3. Quick Filter Badges

Display easy-to-use filter chips/badges:

AC Available

Wi-Fi Included

Mess/Food Included

Generator / UPS

Laundry

Security

Attached Washroom

Budget Friendly (< 6,000 PKR)

Filters should update the listing results without requiring a page reload where practical.

Allow users to combine multiple filters.

4. Accommodation Listing Cards

Each listing card should display:

Property/hostel name

Main photo

Gender

Monthly rent

Room configuration

Location

Distance from selected campus if available

Important amenities

Availability status

Short description

"View Details" button

"WhatsApp" button

Example:

Al-Noor Boys Hostel

Rs. 5,500/month

Double Sharing • Wi-Fi • Mess • Generator

Kotri

[View Details] [WhatsApp]

Cards should be visually clean and easy to scan on mobile.

5. Create Listing / List a Property

Create a modern multi-step listing creation wizard.

Step 1 — Listing Type

Allow the user to select:

Hostel / Property

Private Room

Shared Room

Roommate Wanted

Step 2 — Basic Information

Fields:

Property/Listing Title

Description

Monthly Rent (PKR)

Security Deposit (optional)

Target Gender:

Boys

Girls

Room Configuration:

Single

Double Sharing

Triple Sharing

Other

Number of Available Beds/Rooms

Availability:

Available Now

Available From Date

Step 3 — Location

Fields:

Area

Full address/location description

Nearby campus:

UoS

MUET

LUMHS

Optional map location / coordinates

Use a map picker with Leaflet.js + OpenStreetMap.

Do NOT require a Google Maps API key.

Step 4 — Amenities

Provide a visual checklist:

AC

Wi-Fi

Mess / Food

Generator

UPS

Laundry

Security Guard

CCTV

Attached Washroom

Shared Washroom

Parking

Water Supply

Electricity Included

Gas

Study Area

Kitchen

Step 5 — Contact Numbers

Create a dynamic contact-number section.

The poster must be able to add multiple numbers.

Each number should have a label, for example:

Owner Number
0300-1234567

Manager Number
0312-1234567

Warden Number
0333-1234567

Provide an "Add Another Number" button.

Each contact should support:

Label

Phone number

WhatsApp enabled/disabled

Phone numbers should be clickable on mobile using tel: links.

Step 6 — Images

Create a drag-and-drop/multi-file image uploader.

Allow users to upload multiple pictures, including:

Exterior

Bedroom

Bathroom

Kitchen

Common area

Mess

Other facilities

Show thumbnails before submission.

Allow users to:

Reorder images

Remove images

Select a primary/cover image

Compress/resize images where appropriate for performance.

Step 7 — Preview & Submit

Show a complete preview of the listing before publishing.

Button:

Submit Listing

New listings should enter Pending status if moderation is enabled.

6. Listing Database / Data Structure

Design the backend/database so each listing can store:

ID

User ID

Listing type

Title

Description

Gender

Monthly rent

Security deposit

Room type

Available beds

Availability

Area

Address

Latitude

Longitude

Nearby campus

Amenities

Images

Contact numbers

Created date

Updated date

Approval status

Contact numbers should be stored as a separate/repeatable data structure rather than a single phone-number field.

7. Search & Filtering

Create a dedicated search/results page.

Users should be able to filter by:

Boys / Girls

Campus

Area

Minimum rent

Maximum rent

Room type

AC

Wi-Fi

Mess

Generator/UPS

Laundry

Security

Attached washroom

Availability

Add sorting options:

Lowest Rent

Highest Rent

Newest Listings

Closest to Campus

Search results should update dynamically.

8. Split-Screen Listings + Map

On desktop, create a dual-pane interface:

Left side

Scrollable listing cards.

Right side

Interactive Leaflet map.

Use:

Leaflet.js + OpenStreetMap

Do not require or use a Google Maps API key.

Display:

Hostel/property markers

Roommate/shared-room markers where appropriate

University of Sindh landmark

MUET landmark

LUMHS landmark

Clicking a marker should display a small popup containing:

Property name

Rent

Room type

Main image if practical

"View Details" button

Clicking a listing card should highlight/focus its corresponding map marker.

On mobile, switch to a user-friendly layout such as:

Listings / Map toggle

rather than forcing a side-by-side layout.

9. Campus Distance

Where coordinates are available, calculate an approximate distance between the listing and the selected university/campus.

Display something like:

1.2 km from MUET

or

Approx. 8 min drive

Do not claim exact walking/driving times unless a routing service is actually implemented.

10. Listing Details Page

Create a dedicated details page for every listing.

At the top:

Large image gallery

Property title

Gender

Rent

Availability

Location

Then display:

Room Information

Single / Double / Triple

Number of available beds

Monthly rent

Security deposit if applicable

Amenities

Display amenities using clean icons.

Description

Full property description.

Location

Show the property on a Leaflet/OpenStreetMap map along with nearby campuses/landmarks.

Contact

Display every contact number separately.

Example:

Owner
0300-1234567

[Call] [WhatsApp]

Manager
0312-1234567

[Call] [WhatsApp]

Each WhatsApp button should open WhatsApp with a pre-filled message:

"Hi, I am interested in your listing [Property Title] posted on Jamshoro Hostel Finder. Is it still available?"

Generate the appropriate WhatsApp URL dynamically using the selected phone number and URL-encoded message.

11. Roommate Wanted Listings

Students should also be able to create roommate listings.

Example:

Looking for 1 roommate near MUET

Boys

Double sharing

Rs. 4,500/month

Near MUET

Available from October

Roommate listings should use the same image/contact/location system where appropriate.

Clearly distinguish between:

Hostel/Property Listing

and

Roommate Wanted

using badges.

12. User Dashboard

Create a simple dashboard for logged-in users.

Display:

My Listings

Active

Pending

Rejected

Actions:

View

Edit

Delete

Mark as unavailable

Also provide:

Profile settings

Contact information

Logout

13. Trust & Safety

Add basic reporting functionality.

Each public listing should have:

Report Listing

Possible reasons:

Wrong information

Fake listing

Already unavailable

Inappropriate content

Spam/scam

Administrators should be able to review reports.

Do not expose unnecessary private user information publicly.

14. Design System

Use a modern, trustworthy visual style.

Colors

Primary:

Deep Blue / Navy

Teal accents

Background:

White

Very light gray

CTA:

High-contrast blue/teal

Use subtle borders, rounded cards, clean spacing, and restrained shadows.

Typography should be modern and highly readable.

Use consistent icons for:

AC

Wi-Fi

Food

Generator

Laundry

Security

Bathroom

Parking

Location

Phone

WhatsApp

15. Responsive Design

The application must be mobile-first.

Desktop:

Split-screen listings + map

Full navigation

Multi-column cards where appropriate

Tablet:

Responsive two-column layouts

Mobile:

Single-column cards

Sticky search/filter controls where useful

Listings/Map toggle

Large touch-friendly buttons

Simple bottom navigation if appropriate

All forms must be easy to use on small screens.

16. Performance & UX

Implement:

Lazy loading for listing images

Image compression

Loading skeletons

Empty states

Error states

Form validation

Clear success/error messages

Confirmation before deleting a listing

Pagination or infinite scrolling for large numbers of listings

Avoid unnecessary animations.

The interface should feel fast and lightweight.

17. Important Technical Requirement

Use Leaflet.js + OpenStreetMap for mapping so that the application does not depend on a Google Maps API key.

Use a proper tile-provider configuration suitable for production and respect the provider's usage policy.

The architecture should make it easy to replace the map/tile provider later if required.

18. Final Goal

The final application should feel like a real local student accommodation marketplace specifically designed for Jamshoro and Kotri students.

A new student should be able to:

Choose Boys' or Girls' accommodation.

Search for UoS, MUET, LUMHS, or a nearby area.

Filter by rent and amenities.

Compare listings on a map.

Open a listing.

Browse real uploaded photos.

See room-sharing details.

See all available contact numbers.

Call the owner/operator.

Contact them directly through WhatsApp.

A hostel operator should be able to:

Sign up.

Create a listing.

Upload multiple photos.

Add multiple labeled contact numbers.

Set rent, gender, room type, location, and amenities.

Submit the listing.

Edit/manage the listing from their dashboard.

The result should be a polished, production-ready student housing discovery platform rather than a simple static landing page.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1751b88d-47ef-400f-9ca0-d39dbb489e36).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
