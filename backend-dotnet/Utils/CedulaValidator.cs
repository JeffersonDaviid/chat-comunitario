using System.Text.RegularExpressions;

namespace ChatComunitario.Utils;

public static class CedulaValidator
{
    public static bool ValidateEcuadorianId(string cedula)
    {
        if (!Regex.IsMatch(cedula, @"^\d{10}$"))
            return false;

        var province = int.Parse(cedula.Substring(0, 2));
        if (province < 1 || province > 24)
            return false;

        var digits = cedula.Select(c => int.Parse(c.ToString())).ToArray();
        var verifier = digits[9];

        var coefficients = new[] { 2, 1, 2, 1, 2, 1, 2, 1, 2 };
        var sum = 0;

        for (int i = 0; i < 9; i++)
        {
            var value = digits[i] * coefficients[i];
            if (value > 9) value -= 9;
            sum += value;
        }

        var calculatedVerifier = (10 - (sum % 10)) % 10;
        return verifier == calculatedVerifier;
    }
}
