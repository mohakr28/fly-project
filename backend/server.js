// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const LegalDocument = require("./models/LegalDocument");
const Event = require("./models/Event");
const { initVectorServices } = require("./config/pinecone");

const { fetchAndProcessFlights } = require("./services/aeroDataBoxService");
const { fetchAndStoreEvents } = require("./services/eventService");
const { LegalDocumentMonitor } = require("./services/legalMonitorService");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- Simple Request Logger Middleware ---
app.use((req, res, next) => {
  console.log(`[Request] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/flights", require("./routes/api/flights"));
app.use("/api/events", require("./routes/api/events"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/legal", require("./routes/api/legal"));
app.use("/api/airports", require("./routes/api/airports")); // ✅ إضافة المسار الجديد

const createDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@admin.com";
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log("LOG: Default admin user not found. Creating one...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin", salt);
      adminUser = new User({
        name: "admin",
        email: adminEmail,
        password: hashedPassword,
      });
      await adminUser.save();
      console.log(
        "LOG: Default admin user created with password 'admin'. Please change it immediately."
      );
    } else {
      console.log("LOG: Default admin user already exists.");
    }
  } catch (error) {
    console.error("Error creating default admin user:", error);
    process.exit(1);
  }
};

const seedInitialRegulation = async () => {
  try {
    const celexId = "32004R0261";
    let regulation = await LegalDocument.findOne({ celexId });

    const articlesData = [
        { articleNumber: "Article 1", title: "Subject", text: "1. This Regulation establishes, under the conditions specified herein, minimum rights for passengers when:\n(a) they are denied boarding against their will;\n(b) their flight is cancelled;\n(c) their flight is delayed.\n2. Application of this Regulation to Gibraltar airport is understood to be without prejudice to the respective legal positions of the Kingdom of Spain and the United Kingdom with regard to the dispute over sovereignty over the territory in which the airport is situated.\n3. Application of this Regulation to Gibraltar airport shall be suspended until the arrangements in the Joint Declaration made by the Foreign Ministers of the Kingdom of Spain and the United Kingdom on 2 December 1987 enter into operation. The Governments of Spain and the United Kingdom will inform the Council of such date of entry into operation.", tags: ["scope", "overview"] },
        { articleNumber: "Article 2", title: "Definitions", text: "For the purposes of this Regulation:\n(a) 'air carrier' means an air transport undertaking with a valid operating licence;\n(b) 'operating air carrier' means an air carrier that performs or intends to perform a flight under a contract with a passenger or on behalf of another person, legal or natural, having a contract with that passenger;\n(c) 'Community carrier' means an air carrier with a valid operating licence granted by a Member State in accordance with the provisions of Council Regulation (EEC) No 2407/92 of 23 July 1992 on licensing of air carriers(5);\n(d) 'tour operator' means, with the exception of an air carrier, an organiser within the meaning of Article 2, point 2, of Council Directive 90/314/EEC of 13 June 1990 on package travel, package holidays and package tours(6);\n(e) 'package' means those services defined in Article 2, point 1, of Directive 90/314/EEC;\n(f) 'ticket' means a valid document giving entitlement to transport, or something equivalent in paperless form, including electronic form, issued or authorised by the air carrier or its authorised agent;\n(g) 'reservation' means the fact that the passenger has a ticket, or other proof, which indicates that the reservation has been accepted and registered by the air carrier or tour operator;\n(h) 'final destination' means the destination on the ticket presented at the check-in counter or, in the case of directly connecting flights, the destination of the last flight; alternative connecting flights available shall not be taken into account if the original planned arrival time is respected;\n(i) 'person with reduced mobility' means any person whose mobility is reduced when using transport because of any physical disability (sensory or locomotory, permanent or temporary), intellectual impairment, age or any other cause of disability, and whose situation needs special attention and adaptation to the person's needs of the services made available to all passengers;\n(j) 'denied boarding' means a refusal to carry passengers on a flight, although they have presented themselves for boarding under the conditions laid down in Article 3(2), except where there are reasonable grounds to deny them boarding, such as reasons of health, safety or security, or inadequate travel documentation;\n(k) 'volunteer' means a person who has presented himself for boarding under the conditions laid down in Article 3(2) and responds positively to the air carrier's call for passengers prepared to surrender their reservation in exchange for benefits.\n(l) 'cancellation' means the non-operation of a flight which was previously planned and on which at least one place was reserved.", tags: ["definitions"] },
        { articleNumber: "Article 3", title: "Scope", text: "1. This Regulation shall apply:\n(a) to passengers departing from an airport located in the territory of a Member State to which the Treaty applies;\n(b) to passengers departing from an airport located in a third country to an airport situated in the territory of a Member State to which the Treaty applies, unless they received benefits or compensation and were given assistance in that third country, if the operating air carrier of the flight concerned is a Community carrier.\n2. Paragraph 1 shall apply on the condition that passengers:\n(a) have a confirmed reservation on the flight concerned and, except in the case of cancellation referred to in Article 5, present themselves for check-in,\n- as stipulated and at the time indicated in advance and in writing (including by electronic means) by the air carrier, the tour operator or an authorised travel agent,\nor, if no time is indicated,\n- not later than 45 minutes before the published departure time; or\n(b) have been transferred by an air carrier or tour operator from the flight for which they held a reservation to another flight, irrespective of the reason.\n3. This Regulation shall not apply to passengers travelling free of charge or at a reduced fare not available directly or indirectly to the public. However, it shall apply to passengers having tickets issued under a frequent flyer programme or other commercial programme by an air carrier or tour operator.\n4. This Regulation shall only apply to passengers transported by motorised fixed wing aircraft.\n5. This Regulation shall apply to any operating air carrier providing transport to passengers covered by paragraphs 1 and 2. Where an operating air carrier which has no contract with the passenger performs obligations under this Regulation, it shall be regarded as doing so on behalf of the person having a contract with that passenger.\n6. This Regulation shall not affect the rights of passengers under Directive 90/314/EEC. This Regulation shall not apply in cases where a package tour is cancelled for reasons other than cancellation of the flight.", tags: ["scope", "applicability", "conditions"] },
        { articleNumber: "Article 4", title: "Denied boarding", text: "1. When an operating air carrier reasonably expects to deny boarding on a flight, it shall first call for volunteers to surrender their reservations in exchange for benefits under conditions to be agreed between the passenger concerned and the operating air carrier. Volunteers shall be assisted in accordance with Article 8, such assistance being additional to the benefits mentioned in this paragraph.\n2. If an insufficient number of volunteers comes forward to allow the remaining passengers with reservations to board the flight, the operating air carrier may then deny boarding to passengers against their will.\n3. If boarding is denied to passengers against their will, the operating air carrier shall immediately compensate them in accordance with Article 7 and assist them in accordance with Articles 8 and 9.", tags: ["denied_boarding", "assistance", "compensation", "rerouting", "reimbursement", "volunteers"] },
        { articleNumber: "Article 5", title: "Cancellation", text: "1. In case of cancellation of a flight, the passengers concerned shall:\n(a) be offered assistance by the operating air carrier in accordance with Article 8; and\n(b) be offered assistance by the operating air carrier in accordance with Article 9(1)(a) and 9(2), as well as, in event of re-routing when the reasonably expected time of departure of the new flight is at least the day after the departure as it was planned for the cancelled flight, the assistance specified in Article 9(1)(b) and 9(1)(c); and\n(c) have the right to compensation by the operating air carrier in accordance with Article 7, unless:\n(i) they are informed of the cancellation at least two weeks before the scheduled time of departure; or\n(ii) they are informed of the cancellation between two weeks and seven days before the scheduled time of departure and are offered re-routing, allowing them to depart no more than two hours before the scheduled time of departure and to reach their final destination less than four hours after the scheduled time of arrival; or\n(iii) they are informed of the cancellation less than seven days before the scheduled time of departure and are offered re-routing, allowing them to depart no more than one hour before the scheduled time of departure and to reach their final destination less than two hours after the scheduled time of arrival.\n2. When passengers are informed of the cancellation, an explanation shall be given concerning possible alternative transport.\n3. An operating air carrier shall not be obliged to pay compensation in accordance with Article 7, if it can prove that the cancellation is caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken.\n4. The burden of proof concerning the questions as to whether and when the passenger has been informed of the cancellation of the flight shall rest with the operating air carrier.", tags: ["cancellation", "assistance", "compensation", "rerouting", "reimbursement", "information", "extraordinary_circumstances"] },
        { articleNumber: "Article 6", title: "Delay", text: "1. When an operating air carrier reasonably expects a flight to be delayed beyond its scheduled time of departure:\n(a) for two hours or more in the case of flights of 1500 kilometres or less; or\n(b) for three hours or more in the case of all intra-Community flights of more than 1500 kilometres and of all other flights between 1500 and 3500 kilometres; or\n(c) for four hours or more in the case of all flights not falling under (a) or (b),\npassengers shall be offered by the operating air carrier:\n(i) the assistance specified in Article 9(1)(a) and 9(2); and\n(ii) when the reasonably expected time of departure is at least the day after the time of departure previously announced, the assistance specified in Article 9(1)(b) and 9(1)(c); and\n(iii) when the delay is at least five hours, the assistance specified in Article 8(1)(a).\n2. In any event, the assistance shall be offered within the time limits set out above with respect to each distance bracket.", tags: ["delay", "assistance", "care", "reimbursement"] },
        { articleNumber: "Article 7", title: "Right to compensation", text: "1. Where reference is made to this Article, passengers shall receive compensation amounting to:\n(a) EUR 250 for all flights of 1500 kilometres or less;\n(b) EUR 400 for all intra-Community flights of more than 1500 kilometres, and for all other flights between 1500 and 3500 kilometres;\n(c) EUR 600 for all flights not falling under (a) or (b).\nIn determining the distance, the basis shall be the last destination at which the denial of boarding or cancellation will delay the passenger's arrival after the scheduled time.\n2. When passengers are offered re-routing to their final destination on an alternative flight pursuant to Article 8, the arrival time of which does not exceed the scheduled arrival time of the flight originally booked\n(a) by two hours, in respect of all flights of 1500 kilometres or less; or\n(b) by three hours, in respect of all intra-Community flights of more than 1500 kilometres and for all other flights between 1500 and 3500 kilometres; or\n(c) by four hours, in respect of all flights not falling under (a) or (b),\nthe operating air carrier may reduce the compensation provided for in paragraph 1 by 50 %.\n3. The compensation referred to in paragraph 1 shall be paid in cash, by electronic bank transfer, bank orders or bank cheques or, with the signed agreement of the passenger, in travel vouchers and/or other services.\n4. The distances given in paragraphs 1 and 2 shall be measured by the great circle route method.", tags: ["compensation", "denied_boarding", "cancellation", "delay", "distance", "payment"] },
        { articleNumber: "Article 8", title: "Right to reimbursement or re-routing", text: "1. Where reference is made to this Article, passengers shall be offered the choice between:\n(a) - reimbursement within seven days, by the means provided for in Article 7(3), of the full cost of the ticket at the price at which it was bought, for the part or parts of the journey not made, and for the part or parts already made if the flight is no longer serving any purpose in relation to the passenger's original travel plan, together with, when relevant,\n- a return flight to the first point of departure, at the earliest opportunity;\n(b) re-routing, under comparable transport conditions, to their final destination at the earliest opportunity; or\n(c) re-routing, under comparable transport conditions, to their final destination at a later date at the passenger's convenience, subject to availability of seats.\n2. Paragraph 1(a) shall also apply to passengers whose flights form part of a package, except for the right to reimbursement where such right arises under Directive 90/314/EEC.\n3. When, in the case where a town, city or region is served by several airports, an operating air carrier offers a passenger a flight to an airport alternative to that for which the booking was made, the operating air carrier shall bear the cost of transferring the passenger from that alternative airport either to that for which the booking was made, or to another close-by destination agreed with the passenger.", tags: ["reimbursement", "rerouting", "cancellation", "denied_boarding", "delay"] },
        { articleNumber: "Article 9", title: "Right to care", text: "1. Where reference is made to this Article, passengers shall be offered free of charge:\n(a) meals and refreshments in a reasonable relation to the waiting time;\n(b) hotel accommodation in cases\n- where a stay of one or more nights becomes necessary, or\n- where a stay additional to that intended by the passenger becomes necessary;\n(c) transport between the airport and place of accommodation (hotel or other).\n2. In addition, passengers shall be offered free of charge two telephone calls, telex or fax messages, or e-mails.\n3. In applying this Article, the operating air carrier shall pay particular attention to the needs of persons with reduced mobility and any persons accompanying them, as well as to the needs of unaccompanied children.", tags: ["assistance", "care", "delay", "cancellation", "denied_boarding", "food", "hotel", "communication"] },
        { articleNumber: "Article 10", title: "Upgrading and downgrading", text: "1. If an operating air carrier places a passenger in a class higher than that for which the ticket was purchased, it may not request any supplementary payment.\n2. If an operating air carrier places a passenger in a class lower than that for which the ticket was purchased, it shall within seven days, by the means provided for in Article 7(3), reimburse\n(a) 30 % of the price of the ticket for all flights of 1500 kilometres or less, or\n(b) 50 % of the price of the ticket for all intra-Community flights of more than 1500 kilometres, except flights between the European territory of the Member States and the French overseas departments, and for all other flights between 1500 and 3500 kilometres, or\n(c) 75 % of the price of the ticket for all flights not falling under (a) or (b), including flights between the European territory of the Member States and the French overseas departments.", tags: ["downgrading", "reimbursement", "class"] },
        { articleNumber: "Article 11", title: "Persons with reduced mobility or special needs", text: "1. Operating air carriers shall give priority to carrying persons with reduced mobility and any persons or certified service dogs accompanying them, as well as unaccompanied children.\n2. In cases of denied boarding, cancellation and delays of any length, persons with reduced mobility and any persons accompanying them, as well as unaccompanied children, shall have the right to care in accordance with Article 9 as soon as possible.", tags: ["special_needs", "reduced_mobility", "assistance", "care"] },
        { articleNumber: "Article 12", title: "Further compensation", text: "1. This Regulation shall apply without prejudice to a passenger's rights to further compensation. The compensation granted under this Regulation may be deducted from such compensation.\n2. Without prejudice to relevant principles and rules of national law, including case-law, paragraph 1 shall not apply to passengers who have voluntarily surrendered a reservation under Article 4(1).", tags: ["further_compensation", "national_law"] },
        { articleNumber: "Article 13", title: "Right of redress", text: "In cases where an operating air carrier pays compensation or meets the other obligations incumbent on it under this Regulation, no provision of this Regulation may be interpreted as restricting its right to seek compensation from any person, including third parties, in accordance with the law applicable. In particular, this Regulation shall in no way restrict the operating air carrier's right to seek reimbursement from a tour operator or another person with whom the operating air carrier has a contract. Similarly, no provision of this Regulation may be interpreted as restricting the right of a tour operator or a third party, other than a passenger, with whom an operating air carrier has a contract, to seek reimbursement or compensation from the operating air carrier in accordance with applicable relevant laws.", tags: ["redress", "third_party", "tour_operator"] },
        { articleNumber: "Article 14", title: "Obligation to inform passengers of their rights", text: "1. The operating air carrier shall ensure that at check-in a clearly legible notice containing the following text is displayed in a manner clearly visible to passengers: 'If you are denied boarding or if your flight is cancelled or delayed for at least two hours, ask at the check-in counter or boarding gate for the text stating your rights, particularly with regard to compensation and assistance'.\n2. An operating air carrier denying boarding or cancelling a flight shall provide each passenger affected with a written notice setting out the rules for compensation and assistance in line with this Regulation. It shall also provide each passenger affected by a delay of at least two hours with an equivalent notice. The contact details of the national designated body referred to in Article 16 shall also be given to the passenger in written form.\n3. In respect of blind and visually impaired persons, the provisions of this Article shall be applied using appropriate alternative means.", tags: ["information", "passenger_rights", "notice"] },
        { articleNumber: "Article 15", title: "Exclusion of waiver", text: "1. Obligations vis-à-vis passengers pursuant to this Regulation may not be limited or waived, notably by a derogation or restrictive clause in the contract of carriage.\n2. If, nevertheless, such a derogation or restrictive clause is applied in respect of a passenger, or if the passenger is not correctly informed of his rights and for that reason has accepted compensation which is inferior to that provided for in this Regulation, the passenger shall still be entitled to take the necessary proceedings before the competent courts or bodies in order to obtain additional compensation.", tags: ["waiver", "contract", "passenger_rights"] },
    ];

    if (!regulation) {
      console.log(`LOG: Seeding initial regulation: ${celexId}...`);
      regulation = new LegalDocument({
        celexId: celexId,
        documentType: "regulation",
        title: "Regulation (EC) No 261/2004 of the European Parliament and of the Council",
        summary: "Establishes common rules on compensation and assistance to passengers in the event of denied boarding and of cancellation or long delay of flights.",
        publicationDate: new Date("2004-02-11"),
        keywords: ["compensation", "assistance", "passengers", "denied boarding", "cancellation", "delay", "flights", "EC 261/2004"],
        articles: articlesData,
      });
      await regulation.save();
      console.log("LOG: Initial regulation seeded successfully. IMPORTANT: You must now run the indexing script.");

    } else {
        console.log("LOG: Initial regulation already exists.");
        if (!regulation.articles || regulation.articles.length < 5) {
            console.log("LOG: Regulation found, but articles are missing or incomplete. Seeding articles...");
            regulation.articles = articlesData;
            await regulation.save();
            console.log("LOG: Articles seeded successfully. IMPORTANT: You must now run the indexing script.");
        }
    }
  } catch (error) {
    console.error("Error seeding initial regulation:", error);
    process.exit(1);
  }
};

const startApp = async (appInstance) => {
  try {
    console.log("LOG: Starting server initialization...");
    await connectDB();
    await initVectorServices();
    await createDefaultAdmin();
    await seedInitialRegulation();

    appInstance.locals.pendingEventsCount = await Event.countDocuments({ status: "pending_approval" });
    console.log(`LOG: Initial pending events count: ${appInstance.locals.pendingEventsCount}`);
    
    console.log("LOG: Initializing Legal Document Monitor...");
    const legalMonitor = new LegalDocumentMonitor();

    const initialDocs = await LegalDocument.find({});
    if (initialDocs.length > 0) {
      console.log(`LOG: Found ${initialDocs.length} legal documents to monitor.`);
      initialDocs.forEach((doc) => {
        legalMonitor.addDocument(doc.celexId, doc.publicationDate);
      });
    }

    const runAllDataJobs = async () => {
      console.log("LOG: [Master Job] Running all data fetching and monitoring jobs...");
      await fetchAndProcessFlights();
      await fetchAndStoreEvents(appInstance);
      if (legalMonitor.documents.size > 0) {
         await legalMonitor.checkForUpdates();
      }
      console.log("LOG: [Master Job] All jobs completed.");
    };

    console.log("LOG: Setting up cron jobs...");
    console.log("LOG: [Initial Run] Performing initial run of all data jobs at startup...");
    runAllDataJobs();

    cron.schedule("*/15 * * * *", () => {
      console.log("LOG: [Cron] Triggering all data jobs...");
      runAllDataJobs();
    });

    console.log("LOG: Cron jobs scheduled successfully.");

    const PORT = process.env.PORT || 5000;
    appInstance.listen(PORT, () =>
      console.log(`✅ Backend server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startApp(app);