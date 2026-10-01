BusMitra KTCL Fare Data

STOP COUNT
The GTFS source available in this workspace contains 3,255 stops with valid coordinates.
If your current master contains 3,257 stops, replace/merge the master stop file with that exact
3,257-stop source before production use.

FARE CALCULATION
General single-journey fare:
0-3 km = ₹10
3.1-8 km = ₹15
Every additional 8 km or part thereof = +₹5

Student single journey = 50% of applicable fare.
Senior citizen single journey = 50% of applicable fare.

Monthly-pass discounts are separate and must NOT be applied to ordinary single-ticket fares.

OD COVERAGE
This file contains 249,093 unique ordered origin→destination pairs observed downstream
on scheduled GTFS trips. Distances are derived from consecutive GTFS stop coordinates because
the GTFS shapes.txt source is empty. These are NOT official road-distance measurements.

PRODUCTION RULE
The Journey Planner should dynamically calculate fare from the actual selected journey legs.
For transfers, calculate each transit leg separately and combine according to the applicable
fare policy. Do not invent a direct fare for stop pairs with no direct scheduled service.

SPECIAL FARES
Airport shuttle fares are stored separately and should be selected only for matching services.

SOURCE
Goa/Kadamba GTFS and official KTCL/government tariff information previously verified for BusMitra.
