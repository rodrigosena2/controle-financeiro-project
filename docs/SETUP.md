# Preparação do ambiente

## Requisitos desta etapa

- Git
- Node.js LTS
- npm
- Editor de código, como VS Code

Foram validados Node.js 24.19.0 e npm 11.17.0. Depois de uma instalação nova, abra outro terminal para atualizar o `PATH`.

## Instalação e execução

```powershell
git clone https://github.com/rodrigosena2/controle-financeiro-project.git
cd controle-financeiro-project
npm.cmd install
npm.cmd run build
dotnet run --project backend/ControleFinanceiro.Api
```

Abra `https://localhost:7091`. Configure primeiro o banco e o certificado conforme
[AUTHENTICATION.md](AUTHENTICATION.md). O `npm start` isolado serve somente o React,
sem os endpoints de autenticação; o fluxo completo usa o build servido pelo .NET.
Para IPv4/celular, veja [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md).

## Verificação completa

```powershell
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run lint
npm.cmd run build
dotnet build ControleFinanceiro.slnx
dotnet test ControleFinanceiro.slnx
```

## Preparação para a etapa full stack

O computador possui SQL Server Express LocalDB, usado pelo backend em desenvolvimento, além do SDK do .NET 10. Recomenda-se Visual Studio com a carga **ASP.NET e desenvolvimento Web** e SSMS para inspeção do banco. A instância `BARTENDER` pertence a outro software e não deve ser usada pelo projeto.
