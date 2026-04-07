# Property Commute Analyzer Extension

A powerful, brand-aligned Chrome extension for **realestate.com.au** that automatically calculates and displays commute times and nearby amenities directly on property listing pages.

![Icon](https://img.shields.io/badge/Chrome-Extension-red?style=for-the-badge&logo=google-chrome)

## 🚀 Features

- **Native REA Integration**: Designed with the signature Red, Black, and White palette of realestate.com.au for a seamless user experience.
- **Multi-Modal Commutes**: Calculate travel times for **Transit**, **Driving**, **Walking**, and **Cycling**.
- **Detailed Transit Routes**: Provides step-by-step instructions for public transport (e.g., "Bus 200 → Train T1").
- **Dynamic Amenity Finder**: Automatically finds and calculates travel times to the nearest/top-rated schools, gyms, supermarkets, or any custom query.
- **Smart Sorting**: Choose to sort nearby search results by **Star Rating** or **Proximity**.
- **Privacy First**: All your locations and API keys are stored locally in your browser.

## 🛠 Prerequisites

To use this extension, you need a **Google Cloud Console** account and a valid API Key with the following APIs enabled:

1.  **Directions API**: Used for calculating routes and trip durations.
2.  **Places API**: Used for finding nearby amenities and points of interest.

> [!IMPORTANT]
> Ensure you have billing enabled on your Google Cloud project, although most personal usage fits within the free monthly credit provided by Google.

## 📦 Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/Property-Commute-Analyzer.git
    ```
2.  **Load in Chrome**:
    - Open Chrome and go to `chrome://extensions/`.
    - Enable **Developer mode** (top right toggle).
    - Click **Load unpacked** and select the project folder.
3.  **Configure**:
    - Click the extension icon or navigate to the extension **Options** page.
    - Paste your **Google Maps API Key**.
    - Add your frequent destinations (e.g., "Work", "Parents") or dynamic searches (e.g., "Top Gym").

## 🖥 Usage

Simply navigate to any property listing on `realestate.com.au` (e.g., `/property-house-nsw-...`). The analyzer panel will automatically slide in from the right, providing all your commute and amenity data at a glance.

## 📜 License

MIT License - feel free to use and modify for your own property hunt!
