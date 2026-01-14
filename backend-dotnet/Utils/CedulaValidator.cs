using System.Text.RegularExpressions;

namespace ChatComunitario.Utils;

public static class CedulaValidator
{
    public static bool ValidateEcuadorianId(string cedula)
    {
        // Limpiar espacios en blanco
        cedula = cedula?.Trim() ?? "";
        
        Console.WriteLine($"[CedulaValidator] Validating: '{cedula}' (Length: {cedula.Length})");
        
        if (!Regex.IsMatch(cedula, @"^\d{10}$"))
        {
            Console.WriteLine($"[CedulaValidator] Failed regex check");
            return false;
        }

        var province = int.Parse(cedula.Substring(0, 2));
        if (province < 1 || province > 24)
        {
            Console.WriteLine($"[CedulaValidator] Invalid province: {province}");
            return false;
        }

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
        var isValid = verifier == calculatedVerifier;
        
        Console.WriteLine($"[CedulaValidator] Verifier={verifier}, Calculated={calculatedVerifier}, Valid={isValid}");
        
        return isValid;
    }
}
