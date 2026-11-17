import math
import unittest

from calculations.arrival_radiation_audit import atmosphere_screen, build_audit, terminal_propellant
from calculations.mission_calculations import G


class ArrivalAuditTests(unittest.TestCase):
    def test_terminal_mass_includes_its_tanks(self):
        for dv in [200,500,1000,6000]:
            item = terminal_propellant(345,dv)
            self.assertAlmostEqual(item['propellant_t'],
                1.1*math.expm1(dv/(1800*G))*(345+item['tanks_t']))

    def test_zero_delta_v(self):
        self.assertEqual(terminal_propellant(345,0)['propellant_t'],0)

    def test_area_scaling_and_planet_column(self):
        a,b = atmosphere_screen(350,20),atmosphere_screen(350,40)
        self.assertAlmostEqual(a['ballistic_coefficient_kg_m2'],4*b['ballistic_coefficient_kg_m2'])
        self.assertAlmostEqual(a['local_terminal_speed_m_s'],2*b['local_terminal_speed_m_s'])
        self.assertAlmostEqual(a['atmospheric_vertical_column_kg_m2'],600/11.67)

    def test_dry_ledger_and_original_descent_reproduced(self):
        result = build_audit()
        self.assertAlmostEqual(sum(result['dry_components'].values()),result['dry_t'])
        self.assertAlmostEqual(result['terminal_thermal'][0]['propellant_t'],159.0177294104078,places=5)


if __name__ == '__main__':
    unittest.main()
