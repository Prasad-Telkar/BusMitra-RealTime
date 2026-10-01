BUSMITRA — GOA KTCL FARE DATASET

Coverage:
- Master stop list: 3255 stops from the supplied GTFS feed.
- Fare OD pairs: 249093 ordered origin/destination pairs that occur downstream on scheduled GTFS trips.
- All fare calculations use the KTCL published distance tariff.
- Student and Senior Citizen single-journey fare: 50% of applicable general fare.

IMPORTANT:
1. This dataset does NOT claim that every possible pair of the 3255 stops has a direct bus.
2. ktcl_fare_od_pairs.csv contains scheduled direct/downstream stop pairs found in GTFS.
3. For journeys requiring transfers, BusMitra should calculate each transit leg and combine the applicable fare according to its fare policy.
4. The supplied GTFS has no shapes.txt route geometry, so route_distance_km here is DERIVED by summing straight-line distances between consecutive GTFS stops. It is not an official published stop-to-stop distance.
5. If a route geometry/distance source is later available, replace route_distance_km with that source.
6. Airport/special services should be handled separately if applicable.
7. Verify tariff before production because official fares can change.

Files:
- goa_gtfs_stops_master.csv — all GTFS stops
- ktcl_fare_od_pairs.csv — usable fare lookup for scheduled stop pairs
- ktcl_fare_rules.csv — tariff rules
- ktcl_passenger_categories.csv — passenger fare multipliers
