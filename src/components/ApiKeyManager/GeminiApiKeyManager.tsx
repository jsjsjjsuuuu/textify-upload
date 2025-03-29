
// سأقوم بتصحيح نوع البادج للحالة الناجحة
{info.isValid ? (
  <Badge variant="default" className="bg-green-500">
    <Check className="h-3 w-3 mr-1" /> صالح
  </Badge>
) : (
  <Badge variant="destructive">
    <AlertTriangle className="h-3 w-3 mr-1" /> غير صالح ({info.failCount})
  </Badge>
)}
