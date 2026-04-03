# Inventario Material → modelo de datos (We4Labs)

Este documento cumple la fase **Material → especificación**: mapeo de plantillas en `Material/` hacia entidades en PostgreSQL y criterios de paridad para pruebas.

## Archivos

| Archivo | Formato | Uso en producto |
|---------|---------|------------------|
| `Material/Flujo_de_Caja_Pyme_SAS.xlsx` | Excel | Módulos financieros |
| `Material/calculadora_nomina_colombia.xlsx` | Excel | Nómina + guía legal (contenido) |
| `Material/Guia_Obligaciones_We4Labs.docx` | Word | Guía estructurada (`tax_obligations`, pasos) |

## Flujo_de_Caja_Pyme_SAS.xlsx — hojas

| Hoja Excel | Rutas / tablas app |
|------------|----------------------|
| Supuestos | `scenarios` (nombre, `annual_rate_pct`, `inflation_pct`, notas) |
| Flujo de Caja | `cash_movements` (fecha, tipo inflow/outflow, categoría, monto, `is_projection`) |
| Dashboard | Agregados desde `cash_movements` + `portfolio_items` (KPIs y gráficos) |
| Calendario Tributario | `tax_calendar_events` (`obligation_code`, vencimiento, entidad, periodicidad); enlace opcional a `tax_obligations` vía FK |
| Control de Cartera | `portfolio_items` (CxC/CxP, contraparte, vencimiento, `paid_on`) |

**Paridad / fórmulas**: las fórmulas del libro (LAMBDA, LET, etc.) deben reproducirse en la app como consultas SQL o capa de dominio; para aceptación, definir al menos un caso de prueba por hoja con valores de entrada/salida exportados del Excel.

## calculadora_nomina_colombia.xlsx — hojas

| Hoja | Mapeo |
|------|--------|
| Calculadora Nómina | Entradas alineadas con `payrollCalcInputSchema`; salida con `calculatePayrollColombia` + fila `payroll_parameters` |
| Guía Legal | Contenido textual: campo `body_markdown` en obligaciones relacionadas o bloque de ayuda en UI `/nomina` |

**Paridad**: comparar desglose (aportes empleado/empleador, base IBC simplificada) contra una fila fija del Excel con mismos parámetros SMMLV/auxilio del seed.

## Guia_Obligaciones_We4Labs.docx

Migración recomendada: cada sección → registro `tax_obligations` + ítems `tax_obligation_steps`. El calendario referencia el mismo `code` en `obligation_code` para navegación cruzada.

## Semillas

Los datos iniciales en `packages/db/src/seed.ts` reflejan este inventario de forma ilustrativa (Colombia, 2026). Actualizar anualmente según DIAN y tabla salarial oficial.
