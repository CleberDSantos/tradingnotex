# Imagem base do .NET 8.0
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Imagem para build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# Copia apenas o arquivo de projeto primeiro para otimizar cache
COPY ["TradingNoteX.csproj", "."]
RUN dotnet restore "./TradingNoteX.csproj"
# Copia o restante dos arquivos
COPY . .
WORKDIR "/src/."
RUN dotnet build "TradingNoteX.csproj" -c Release -o /app/build

# Publicação
FROM build AS publish
RUN dotnet publish "TradingNoteX.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Imagem final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TradingNoteX.dll"]