using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using System.Reflection;
using System.Xml.Linq;

namespace GitVault.Api.OpenApi;

/// <summary>
/// Reads /// XML documentation comments from the generated .xml file and injects
/// &lt;summary&gt; as operation.Summary and &lt;remarks&gt; as operation.Description in Scalar.
/// </summary>
internal sealed class XmlDocOperationTransformer : IOpenApiOperationTransformer
{
    // key = "M:Namespace.Class.Method" (no params — controllers don't overload)
    private readonly Dictionary<string, (string? Summary, string? Remarks)> _docs = new();

    public XmlDocOperationTransformer()
    {
        var xmlFile = Path.Combine(AppContext.BaseDirectory, "GitVault.Api.xml");
        if (!File.Exists(xmlFile)) return;

        foreach (var member in XDocument.Load(xmlFile).Descendants("member"))
        {
            var name = member.Attribute("name")?.Value;
            if (name is null || !name.StartsWith("M:")) continue;

            // Strip parameter list so lookup is just "M:Namespace.Class.Method"
            var key = name.Contains('(') ? name[..name.IndexOf('(')] : name;
            var summary = member.Element("summary")?.Value.Trim();
            var remarks  = member.Element("remarks")?.Value.Trim();

            if (!string.IsNullOrWhiteSpace(summary) || !string.IsNullOrWhiteSpace(remarks))
                _docs[key] = (summary, remarks);
        }
    }

    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        if (context.Description.ActionDescriptor is not ControllerActionDescriptor descriptor)
            return Task.CompletedTask;

        var key = $"M:{descriptor.MethodInfo.DeclaringType!.FullName}.{descriptor.MethodInfo.Name}";

        if (_docs.TryGetValue(key, out var docs))
        {
            if (!string.IsNullOrWhiteSpace(docs.Summary))
                operation.Summary = docs.Summary;
            if (!string.IsNullOrWhiteSpace(docs.Remarks))
                operation.Description = docs.Remarks;
        }

        return Task.CompletedTask;
    }
}
