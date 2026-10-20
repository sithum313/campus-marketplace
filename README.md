# UNIZON – Campus Marketplace

**Emerging Trends Course Unit | DCS-CSC2023 | University of Jaffna**

UNIZON is a campus marketplace application developed as a group enhancement of the existing [Campus Marketplace](https://github.com/webtegy/campus-marketplace) project. It aims to make it easier for university students to discover, list, and exchange products through a convenient, responsive interface.

## Project Objectives

- Improve the existing marketplace experience for students.
- Support product discovery through search, category, and price filtering.
- Improve seller and buyer workflows and the overall interface.
- Integrate authentication and marketplace data using Firebase.
- Demonstrate collaborative development through GitHub.

## Features

The team's work focuses on the following areas:

- **Authentication and profiles:** Sign-up, sign-in, and user profiles.
- **Product listings:** Browse listings, view product details, and manage seller listings.
- **Search and filtering:** Search for products and filter by product attributes and price.
- **Favorites:** Save and remove favorite listings.
- **Cart and orders:** Shopping cart design and buyer ordering workflow.
- **Buyer–seller communication:** Chatting feature work.
- **Seller dashboard:** Seller-focused listing management interface.
- **UI/UX:** Improved onboarding, navigation, layouts, and visual consistency.
- **Mobile responsiveness:** Layout improvements for smaller screens.
- **Firebase integration:** Authentication and Cloud Firestore for supported application data.

> Feature descriptions summarize the team's work areas. Confirm that each feature works in the final submitted build before describing it as complete in the demo.

## Team Members and Contributions

| GitHub username | Assigned contribution |
| --- | --- |
| [sithum313](https://github.com/sithum313) | Price and product filtering |
| [kp889-kp](https://github.com/kp889-kp) | Buyer–seller chatting |
| [neha0831](https://github.com/neha0831) | UI/UX design |
| [MohamedMihlarMaryam](https://github.com/MohamedMihlarMaryam) | Mobile responsiveness |
| [imantha35](https://github.com/imantha35) | Cart design |
| [SasangaAkash](https://github.com/SasangaAkash) | Seller dashboard |

Each team member was assigned a specific area of development. We used GitHub branches, commits, and integration work to collaborate on the final application.

## Technologies

- React / React Native with Expo (existing project stack)
- JavaScript / TypeScript
- Firebase Authentication
- Cloud Firestore
- Git and GitHub
- GitHub Desktop
- Visual Studio Code

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- A Firebase project configured for the application

### Installation

1. Clone the team repository:

   ```bash
   git clone https://github.com/sithum313/campus-marketplace.git
   cd campus-marketplace
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file using the project's environment variable template, if provided. Supply the Firebase configuration values for your own project. **Do not commit private keys or secrets.**

4. Start the application using the script configured in `package.json`. For an Expo-based setup, this is commonly:

   ```bash
   npx expo start --web
   ```

5. Open the local development URL shown in the terminal.

> The exact run command and required environment variable names should be verified against the final project's `package.json` and Firebase configuration.

## Testing and Demonstration

The final demonstration should show the user journey from onboarding and authentication through product discovery, seller listing management, filtering, and the team's other working features. It should also include a brief technical overview and the GitHub contribution history.

## GitHub Collaboration

Team members worked on assigned features using GitHub. The repository's branches, commit history, and pull requests (where used) document the development process.

**Team repository:** https://github.com/sithum313/campus-marketplace

**Original repository:** https://github.com/webtegy/campus-marketplace

## Assignment Deliverables

- Final working application in the team GitHub repository
- README documentation
- A 5–8 minute recorded project demonstration

## Acknowledgement

This project builds upon the existing Campus Marketplace codebase provided for the Emerging Trends group assignment. We acknowledge the original project authors and the Department of Computer Science, University of Jaffna, for the learning opportunity.
