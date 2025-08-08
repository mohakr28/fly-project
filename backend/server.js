// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const LegalDocument = require("./models/LegalDocument");

const { fetchAndProcessFlights } = require("./services/aeroDataBoxService");
const { fetchAndStoreEvents } = require("./services/eventService");
// ✅ استيراد المراقب الجديد
const { LegalDocumentMonitor } = require("./services/legalMonitorService");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/flights", require("./routes/api/flights"));
app.use("/api/events", require("./routes/api/events"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/legal", require("./routes/api/legal"));

const createDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@admin.com";
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log("Default admin user not found. Creating one...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin", salt);
      adminUser = new User({
        name: "admin",
        email: adminEmail,
        password: hashedPassword,
      });
      await adminUser.save();
      console.log(
        "Default admin user created with password 'admin'. Please change it immediately."
      );
    }
  } catch (error) {
    console.error("Error creating default admin user:", error);
    process.exit(1);
  }
};

// ✅ --- دالة لإضافة اللائحة الأساسية إلى قاعدة البيانات ---
const seedInitialRegulation = async () => {
  try {
    const celexId = "32004R0261";
    const existingDoc = await LegalDocument.findOne({ celexId });

    if (!existingDoc) {
      console.log(`Seeding initial regulation: ${celexId}...`);

      const regulationData = {
        celexId: celexId,
        documentType: "regulation",
        title:
          "Regulation (EC) No 261/2004 of the European Parliament and of the Council",
        summary:
          "Establishes common rules on compensation and assistance to passengers in the event of denied boarding and of cancellation or long delay of flights.",
        publicationDate: new Date("2004-02-11"),
        keywords: [
          "compensation",
          "assistance",
          "passengers",
          "denied boarding",
          "cancellation",
          "delay",
          "flights",
          "EC 261/2004",
        ],
        fullText: `Regulation (EC) No 261/2004 of the European Parliament and of the Council

of 11 February 2004

establishing common rules on compensation and assistance to passengers in the event of denied boarding and of cancellation or long delay of flights, and repealing Regulation (EEC) No 295/91

(Text with EEA relevance)

THE EUROPEAN PARLIAMENT AND THE COUNCIL OF THE EUROPEAN UNION,

Having regard to the Treaty establishing the European Community, and in particular Article 80(2) thereof,

Having regard to the proposal from the Commission(1),

Having regard to the opinion of the European Economic and Social Committee(2),

After consulting the Committee of the Regions,

Acting in accordance with the procedure laid down in Article 251 of the Treaty(3), in the light of the joint text approved by the Conciliation Committee on 1 December 2003,

Whereas:

(1) Action by the Community in the field of air transport should aim, among other things, at ensuring a high level of protection for passengers. Moreover, full account should be taken of the requirements of consumer protection in general.

(2) Denied boarding and cancellation or long delay of flights cause serious trouble and inconvenience to passengers.

(3) While Council Regulation (EEC) No 295/91 of 4 February 1991 establishing common rules for a denied boarding compensation system in scheduled air transport(4) created basic protection for passengers, the number of passengers denied boarding against their will remains too high, as does that affected by cancellations without prior warning and that affected by long delays.

(4) The Community should therefore raise the standards of protection set by that Regulation both to strengthen the rights of passengers and to ensure that air carriers operate under harmonised conditions in a liberalised market.

(5) Since the distinction between scheduled and non-scheduled air services is weakening, such protection should apply to passengers not only on scheduled but also on non-scheduled flights, including those forming part of package tours.

(6) The protection accorded to passengers departing from an airport located in a Member State should be extended to those leaving an airport located in a third country for one situated in a Member State, when a Community carrier operates the flight.

(7) In order to ensure the effective application of this Regulation, the obligations that it creates should rest with the operating air carrier who performs or intends to perform a flight, whether with owned aircraft, under dry or wet lease, or on any other basis.

(8) This Regulation should not restrict the rights of the operating air carrier to seek compensation from any person, including third parties, in accordance with the law applicable.

(9) The number of passengers denied boarding against their will should be reduced by requiring air carriers to call for volunteers to surrender their reservations, in exchange for benefits, instead of denying passengers boarding, and by fully compensating those finally denied boarding.

(10) Passengers denied boarding against their will should be able either to cancel their flights, with reimbursement of their tickets, or to continue them under satisfactory conditions, and should be adequately cared for while awaiting a later flight.

(11) Volunteers should also be able to cancel their flights, with reimbursement of their tickets, or continue them under satisfactory conditions, since they face difficulties of travel similar to those experienced by passengers denied boarding against their will.

(12) The trouble and inconvenience to passengers caused by cancellation of flights should also be reduced. This should be achieved by inducing carriers to inform passengers of cancellations before the scheduled time of departure and in addition to offer them reasonable re-routing, so that the passengers can make other arrangements. Air carriers should compensate passengers if they fail to do this, except when the cancellation occurs in extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken.

(13) Passengers whose flights are cancelled should be able either to obtain reimbursement of their tickets or to obtain re-routing under satisfactory conditions, and should be adequately cared for while awaiting a later flight.

(14) As under the Montreal Convention, obligations on operating air carriers should be limited or excluded in cases where an event has been caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken. Such circumstances may, in particular, occur in cases of political instability, meteorological conditions incompatible with the operation of the flight concerned, security risks, unexpected flight safety shortcomings and strikes that affect the operation of an operating air carrier.

(15) Extraordinary circumstances should be deemed to exist where the impact of an air traffic management decision in relation to a particular aircraft on a particular day gives rise to a long delay, an overnight delay, or the cancellation of one or more flights by that aircraft, even though all reasonable measures had been taken by the air carrier concerned to avoid the delays or cancellations.

(16) In cases where a package tour is cancelled for reasons other than the flight being cancelled, this Regulation should not apply.

(17) Passengers whose flights are delayed for a specified time should be adequately cared for and should be able to cancel their flights with reimbursement of their tickets or to continue them under satisfactory conditions.

(18) Care for passengers awaiting an alternative or a delayed flight may be limited or declined if the provision of the care would itself cause further delay.

(19) Operating air carriers should meet the special needs of persons with reduced mobility and any persons accompanying them.

(20) Passengers should be fully informed of their rights in the event of denied boarding and of cancellation or long delay of flights, so that they can effectively exercise their rights.

(21) Member States should lay down rules on sanctions applicable to infringements of the provisions of this Regulation and ensure that these sanctions are applied. The sanctions should be effective, proportionate and dissuasive.

(22) Member States should ensure and supervise general compliance by their air carriers with this Regulation and designate an appropriate body to carry out such enforcement tasks. The supervision should not affect the rights of passengers and air carriers to seek legal redress from courts under procedures of national law.

(23) The Commission should analyse the application of this Regulation and should assess in particular the opportunity of extending its scope to all passengers having a contract with a tour operator or with a Community carrier, when departing from a third country airport to an airport in a Member State.

(24) Arrangements for greater cooperation over the use of Gibraltar airport were agreed in London on 2 December 1987 by the Kingdom of Spain and the United Kingdom in a joint declaration by the Ministers of Foreign Affairs of the two countries. Such arrangements have yet to enter into operation.

(25) Regulation (EEC) No 295/91 should accordingly be repealed,

HAVE ADOPTED THIS REGULATION:

Article 1

Subject

1. This Regulation establishes, under the conditions specified herein, minimum rights for passengers when:

(a) they are denied boarding against their will;

(b) their flight is cancelled;

(c) their flight is delayed.

2. Application of this Regulation to Gibraltar airport is understood to be without prejudice to the respective legal positions of the Kingdom of Spain and the United Kingdom with regard to the dispute over sovereignty over the territory in which the airport is situated.

3. Application of this Regulation to Gibraltar airport shall be suspended until the arrangements in the Joint Declaration made by the Foreign Ministers of the Kingdom of Spain and the United Kingdom on 2 December 1987 enter into operation. The Governments of Spain and the United Kingdom will inform the Council of such date of entry into operation.

Article 2

Definitions

For the purposes of this Regulation:

(a) "air carrier" means an air transport undertaking with a valid operating licence;

(b) "operating air carrier" means an air carrier that performs or intends to perform a flight under a contract with a passenger or on behalf of another person, legal or natural, having a contract with that passenger;

(c) "Community carrier" means an air carrier with a valid operating licence granted by a Member State in accordance with the provisions of Council Regulation (EEC) No 2407/92 of 23 July 1992 on licensing of air carriers(5);

(d) "tour operator" means, with the exception of an air carrier, an organiser within the meaning of Article 2, point 2, of Council Directive 90/314/EEC of 13 June 1990 on package travel, package holidays and package tours(6);

(e) "package" means those services defined in Article 2, point 1, of Directive 90/314/EEC;

(f) "ticket" means a valid document giving entitlement to transport, or something equivalent in paperless form, including electronic form, issued or authorised by the air carrier or its authorised agent;

(g) "reservation" means the fact that the passenger has a ticket, or other proof, which indicates that the reservation has been accepted and registered by the air carrier or tour operator;

(h) "final destination" means the destination on the ticket presented at the check-in counter or, in the case of directly connecting flights, the destination of the last flight; alternative connecting flights available shall not be taken into account if the original planned arrival time is respected;

(i) "person with reduced mobility" means any person whose mobility is reduced when using transport because of any physical disability (sensory or locomotory, permanent or temporary), intellectual impairment, age or any other cause of disability, and whose situation needs special attention and adaptation to the person's needs of the services made available to all passengers;

(j) "denied boarding" means a refusal to carry passengers on a flight, although they have presented themselves for boarding under the conditions laid down in Article 3(2), except where there are reasonable grounds to deny them boarding, such as reasons of health, safety or security, or inadequate travel documentation;

(k) "volunteer" means a person who has presented himself for boarding under the conditions laid down in Article 3(2) and responds positively to the air carrier's call for passengers prepared to surrender their reservation in exchange for benefits.

(l) "cancellation" means the non-operation of a flight which was previously planned and on which at least one place was reserved.

Article 3

Scope

1. This Regulation shall apply:

(a) to passengers departing from an airport located in the territory of a Member State to which the Treaty applies;

(b) to passengers departing from an airport located in a third country to an airport situated in the territory of a Member State to which the Treaty applies, unless they received benefits or compensation and were given assistance in that third country, if the operating air carrier of the flight concerned is a Community carrier.

2. Paragraph 1 shall apply on the condition that passengers:

(a) have a confirmed reservation on the flight concerned and, except in the case of cancellation referred to in Article 5, present themselves for check-in,

- as stipulated and at the time indicated in advance and in writing (including by electronic means) by the air carrier, the tour operator or an authorised travel agent,

or, if no time is indicated,

- not later than 45 minutes before the published departure time; or

(b) have been transferred by an air carrier or tour operator from the flight for which they held a reservation to another flight, irrespective of the reason.

3. This Regulation shall not apply to passengers travelling free of charge or at a reduced fare not available directly or indirectly to the public. However, it shall apply to passengers having tickets issued under a frequent flyer programme or other commercial programme by an air carrier or tour operator.

4. This Regulation shall only apply to passengers transported by motorised fixed wing aircraft.

5. This Regulation shall apply to any operating air carrier providing transport to passengers covered by paragraphs 1 and 2. Where an operating air carrier which has no contract with the passenger performs obligations under this Regulation, it shall be regarded as doing so on behalf of the person having a contract with that passenger.

6. This Regulation shall not affect the rights of passengers under Directive 90/314/EEC. This Regulation shall not apply in cases where a package tour is cancelled for reasons other than cancellation of the flight.

Article 4

Denied boarding

1. When an operating air carrier reasonably expects to deny boarding on a flight, it shall first call for volunteers to surrender their reservations in exchange for benefits under conditions to be agreed between the passenger concerned and the operating air carrier. Volunteers shall be assisted in accordance with Article 8, such assistance being additional to the benefits mentioned in this paragraph.

2. If an insufficient number of volunteers comes forward to allow the remaining passengers with reservations to board the flight, the operating air carrier may then deny boarding to passengers against their will.

3. If boarding is denied to passengers against their will, the operating air carrier shall immediately compensate them in accordance with Article 7 and assist them in accordance with Articles 8 and 9.

Article 5

Cancellation

1. In case of cancellation of a flight, the passengers concerned shall:

(a) be offered assistance by the operating air carrier in accordance with Article 8; and

(b) be offered assistance by the operating air carrier in accordance with Article 9(1)(a) and 9(2), as well as, in event of re-routing when the reasonably expected time of departure of the new flight is at least the day after the departure as it was planned for the cancelled flight, the assistance specified in Article 9(1)(b) and 9(1)(c); and

(c) have the right to compensation by the operating air carrier in accordance with Article 7, unless:

(i) they are informed of the cancellation at least two weeks before the scheduled time of departure; or

(ii) they are informed of the cancellation between two weeks and seven days before the scheduled time of departure and are offered re-routing, allowing them to depart no more than two hours before the scheduled time of departure and to reach their final destination less than four hours after the scheduled time of arrival; or

(iii) they are informed of the cancellation less than seven days before the scheduled time of departure and are offered re-routing, allowing them to depart no more than one hour before the scheduled time of departure and to reach their final destination less than two hours after the scheduled time of arrival.

2. When passengers are informed of the cancellation, an explanation shall be given concerning possible alternative transport.

3. An operating air carrier shall not be obliged to pay compensation in accordance with Article 7, if it can prove that the cancellation is caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken.

4. The burden of proof concerning the questions as to whether and when the passenger has been informed of the cancellation of the flight shall rest with the operating air carrier.

Article 6

Delay

1. When an operating air carrier reasonably expects a flight to be delayed beyond its scheduled time of departure:

(a) for two hours or more in the case of flights of 1500 kilometres or less; or

(b) for three hours or more in the case of all intra-Community flights of more than 1500 kilometres and of all other flights between 1500 and 3500 kilometres; or

(c) for four hours or more in the case of all flights not falling under (a) or (b),

passengers shall be offered by the operating air carrier:

(i) the assistance specified in Article 9(1)(a) and 9(2); and

(ii) when the reasonably expected time of departure is at least the day after the time of departure previously announced, the assistance specified in Article 9(1)(b) and 9(1)(c); and

(iii) when the delay is at least five hours, the assistance specified in Article 8(1)(a).

2. In any event, the assistance shall be offered within the time limits set out above with respect to each distance bracket.

Article 7

Right to compensation

1. Where reference is made to this Article, passengers shall receive compensation amounting to:

(a) EUR 250 for all flights of 1500 kilometres or less;

(b) EUR 400 for all intra-Community flights of more than 1500 kilometres, and for all other flights between 1500 and 3500 kilometres;

(c) EUR 600 for all flights not falling under (a) or (b).

In determining the distance, the basis shall be the last destination at which the denial of boarding or cancellation will delay the passenger's arrival after the scheduled time.

2. When passengers are offered re-routing to their final destination on an alternative flight pursuant to Article 8, the arrival time of which does not exceed the scheduled arrival time of the flight originally booked

(a) by two hours, in respect of all flights of 1500 kilometres or less; or

(b) by three hours, in respect of all intra-Community flights of more than 1500 kilometres and for all other flights between 1500 and 3500 kilometres; or

(c) by four hours, in respect of all flights not falling under (a) or (b),

the operating air carrier may reduce the compensation provided for in paragraph 1 by 50 %.

3. The compensation referred to in paragraph 1 shall be paid in cash, by electronic bank transfer, bank orders or bank cheques or, with the signed agreement of the passenger, in travel vouchers and/or other services.

4. The distances given in paragraphs 1 and 2 shall be measured by the great circle route method.

Article 8

Right to reimbursement or re-routing

1. Where reference is made to this Article, passengers shall be offered the choice between:

(a) - reimbursement within seven days, by the means provided for in Article 7(3), of the full cost of the ticket at the price at which it was bought, for the part or parts of the journey not made, and for the part or parts already made if the flight is no longer serving any purpose in relation to the passenger's original travel plan, together with, when relevant,

- a return flight to the first point of departure, at the earliest opportunity;

(b) re-routing, under comparable transport conditions, to their final destination at the earliest opportunity; or

(c) re-routing, under comparable transport conditions, to their final destination at a later date at the passenger's convenience, subject to availability of seats.

2. Paragraph 1(a) shall also apply to passengers whose flights form part of a package, except for the right to reimbursement where such right arises under Directive 90/314/EEC.

3. When, in the case where a town, city or region is served by several airports, an operating air carrier offers a passenger a flight to an airport alternative to that for which the booking was made, the operating air carrier shall bear the cost of transferring the passenger from that alternative airport either to that for which the booking was made, or to another close-by destination agreed with the passenger.

Article 9

Right to care

1. Where reference is made to this Article, passengers shall be offered free of charge:

(a) meals and refreshments in a reasonable relation to the waiting time;

(b) hotel accommodation in cases

- where a stay of one or more nights becomes necessary, or

- where a stay additional to that intended by the passenger becomes necessary;

(c) transport between the airport and place of accommodation (hotel or other).

2. In addition, passengers shall be offered free of charge two telephone calls, telex or fax messages, or e-mails.

3. In applying this Article, the operating air carrier shall pay particular attention to the needs of persons with reduced mobility and any persons accompanying them, as well as to the needs of unaccompanied children.

Article 10

Upgrading and downgrading

1. If an operating air carrier places a passenger in a class higher than that for which the ticket was purchased, it may not request any supplementary payment.

2. If an operating air carrier places a passenger in a class lower than that for which the ticket was purchased, it shall within seven days, by the means provided for in Article 7(3), reimburse

(a) 30 % of the price of the ticket for all flights of 1500 kilometres or less, or

(b) 50 % of the price of the ticket for all intra-Community flights of more than 1500 kilometres, except flights between the European territory of the Member States and the French overseas departments, and for all other flights between 1500 and 3500 kilometres, or

(c) 75 % of the price of the ticket for all flights not falling under (a) or (b), including flights between the European territory of the Member States and the French overseas departments.

Article 11

Persons with reduced mobility or special needs

1. Operating air carriers shall give priority to carrying persons with reduced mobility and any persons or certified service dogs accompanying them, as well as unaccompanied children.

2. In cases of denied boarding, cancellation and delays of any length, persons with reduced mobility and any persons accompanying them, as well as unaccompanied children, shall have the right to care in accordance with Article 9 as soon as possible.

Article 12

Further compensation

1. This Regulation shall apply without prejudice to a passenger's rights to further compensation. The compensation granted under this Regulation may be deducted from such compensation.

2. Without prejudice to relevant principles and rules of national law, including case-law, paragraph 1 shall not apply to passengers who have voluntarily surrendered a reservation under Article 4(1).

Article 13

Right of redress

In cases where an operating air carrier pays compensation or meets the other obligations incumbent on it under this Regulation, no provision of this Regulation may be interpreted as restricting its right to seek compensation from any person, including third parties, in accordance with the law applicable. In particular, this Regulation shall in no way restrict the operating air carrier's right to seek reimbursement from a tour operator or another person with whom the operating air carrier has a contract. Similarly, no provision of this Regulation may be interpreted as restricting the right of a tour operator or a third party, other than a passenger, with whom an operating air carrier has a contract, to seek reimbursement or compensation from the operating air carrier in accordance with applicable relevant laws.

Article 14

Obligation to inform passengers of their rights

1. The operating air carrier shall ensure that at check-in a clearly legible notice containing the following text is displayed in a manner clearly visible to passengers: "If you are denied boarding or if your flight is cancelled or delayed for at least two hours, ask at the check-in counter or boarding gate for the text stating your rights, particularly with regard to compensation and assistance".

2. An operating air carrier denying boarding or cancelling a flight shall provide each passenger affected with a written notice setting out the rules for compensation and assistance in line with this Regulation. It shall also provide each passenger affected by a delay of at least two hours with an equivalent notice. The contact details of the national designated body referred to in Article 16 shall also be given to the passenger in written form.

3. In respect of blind and visually impaired persons, the provisions of this Article shall be applied using appropriate alternative means.

Article 15

Exclusion of waiver

1. Obligations vis-à-vis passengers pursuant to this Regulation may not be limited or waived, notably by a derogation or restrictive clause in the contract of carriage.

2. If, nevertheless, such a derogation or restrictive clause is applied in respect of a passenger, or if the passenger is not correctly informed of his rights and for that reason has accepted compensation which is inferior to that provided for in this Regulation, the passenger shall still be entitled to take the necessary proceedings before the competent courts or bodies in order to obtain additional compensation.

Article 16

Infringements

1. Each Member State shall designate a body responsible for the enforcement of this Regulation as regards flights from airports situated on its territory and flights from a third country to such airports. Where appropriate, this body shall take the measures necessary to ensure that the rights of passengers are respected. The Member States shall inform the Commission of the body that has been designated in accordance with this paragraph.

2. Without prejudice to Article 12, each passenger may complain to any body designated under paragraph 1, or to any other competent body designated by a Member State, about an alleged infringement of this Regulation at any airport situated on the territory of a Member State or concerning any flight from a third country to an airport situated on that territory.

3. The sanctions laid down by Member States for infringements of this Regulation shall be effective, proportionate and dissuasive.

Article 17

Report

The Commission shall report to the European Parliament and the Council by 1 January 2007 on the operation and the results of this Regulation, in particular regarding:

- the incidence of denied boarding and of cancellation of flights,

- the possible extension of the scope of this Regulation to passengers having a contract with a Community carrier or holding a flight reservation which forms part of a "package tour" to which Directive 90/314/EEC applies and who depart from a third-country airport to an airport in a Member State, on flights not operated by Community air carriers,

- the possible revision of the amounts of compensation referred to in Article 7(1).

The report shall be accompanied where necessary by legislative proposals.

Article 18

Repeal

Regulation (EEC) No 295/91 shall be repealed.

Article 19

Entry into force

This Regulation shall enter into force on 17 February 2005.

This Regulation shall be binding in its entirety and directly applicable in all Member States.

Done at Strasbourg, 11 February 2004.

For the European Parliament

The President

P. Cox

For the Council

The President

M. McDowell

(1) OJ C 103 E, 30.4.2002, p. 225 and OJ C 71 E, 25.3.2003, p. 188.

(2) OJ C 241, 7.10.2002, p. 29.

(3) Opinion of the European Parliament of 24 October 2002 (OJ C 300 E, 11.12.2003, p. 443), Council Common Position of 18 March 2003 (OJ C 125 E, 27.5.2003, p. 63) and Position of the European Parliament of 3 July 2003. Legislative Resolution of the European Parliament of 18 December 2003 and Council Decision of 26 January 2004.

(4) OJ L 36, 8.2.1991, p. 5.

(5) OJ L 240, 24.8.1992, p. 1.

(6) OJ L 158, 23.6.1990, p. 59.

Commission Statement

The Commission recalls its intention to promote voluntary agreements or to make proposals to extend Community measures of passenger protection to other modes of transport than air, notably rail and maritime navigation.`,
      };
      await LegalDocument.create(regulationData);
      console.log("Initial regulation seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding initial regulation:", error);
    process.exit(1);
  }
};

const startApp = async () => {
  try {
    await connectDB();
    await createDefaultAdmin();
    await seedInitialRegulation(); // ✅ استدعاء الدالة هنا

    // --- ✅ إعداد وبدء مراقب المستندات القانونية ---
    const legalMonitor = new LegalDocumentMonitor({
      checkInterval: 12 * 60 * 60 * 1000, // كل 12 ساعة
      // يمكن تخصيص onUpdate هنا إذا أردت سلوكًا مختلفًا
    });

    // تحميل الوثائق الموجودة من قاعدة البيانات إلى المراقب
    const initialDocs = await LegalDocument.find({});
    if (initialDocs.length > 0) {
      initialDocs.forEach((doc) => {
        legalMonitor.addDocument(doc.celexId, doc.publicationDate);
      });
      // بدء المراقبة الدورية (ستقوم بفحص فوري بعد 5 ثوانٍ)
      legalMonitor.start();
    } else {
      console.warn(
        "WARNING: Legal documents collection is empty. Add documents via the UI to start monitoring."
      );
    }
    // --- نهاية إعداد المراقب ---

    // --- المهام المجدولة الأخرى (Cron Jobs) ---
    cron.schedule("*/15 * * * *", () => {
      console.log("Cron: Fetching flight data...");
      fetchAndProcessFlights();
    });

    cron.schedule("0 2 * * *", () => {
      console.log("Cron: Fetching event data...");
      fetchAndStoreEvents();
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Backend server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startApp();