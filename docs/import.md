# Bulk Import

## CSV/XLSX columns
Required columns:
- building_name
- address
- porter_phone
- management_name

## Validation rules
- management_name must match an existing management company.
- address is validated with Google Maps Geocoding.
- valid rows are saved, invalid rows are reported in the error file.

## Output
The UI shows:
- Created count
- Failed count
- Downloadable error CSV
