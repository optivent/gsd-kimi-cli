class GsdKimiCli < Formula
  desc "Get Shit Done - Spec-driven development workflow system for Kimi CLI"
  homepage "https://github.com/optivent/gsd-kimi-cli"
  
  version "2.0.0"
  license "MIT"
  
  url "https://github.com/optivent/gsd-kimi-cli/releases/download/v2.0.0/gsd-kimi-cli-2.0.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  
  depends_on "node@20"
  
  def install
    libexec.install Dir["*"]
    
    # Create wrapper scripts
    (bin/"gsd-kimi-install").write <<~EOS
      #!/bin/bash
      cd "#{libexec}"
      node scripts/install.js "$@"
    EOS
    
    (bin/"gsd-kimi-patch").write <<~EOS
      #!/bin/bash
      cd "#{libexec}"
      node scripts/patch.js "$@"
    EOS
    
    (bin/"gsd-kimi-verify").write <<~EOS
      #!/bin/bash
      cd "#{libexec}"
      node scripts/verify.js "$@"
    EOS
    
    chmod 0755, bin/"gsd-kimi-install"
    chmod 0755, bin/"gsd-kimi-patch"
    chmod 0755, bin/"gsd-kimi-verify"
  end
  
  def caveats
    <<~EOS
      GSD (Get Shit Done) for Kimi CLI has been installed!
      
      To complete setup:
        1. Install Kimi CLI: pip install kimi-cli
        2. Run: gsd-kimi-install
        3. (Optional) Apply patches: gsd-kimi-patch
        4. Start using: jim
      
      Documentation: #{libexec}/docs/
      
      For updates:
        brew upgrade gsd-kimi-cli
        gsd-kimi-install
    EOS
  end
  
  test do
    assert_match "GSD", shell_output("#{bin}/gsd-kimi-install --help 2>&1 || true")
    assert_predicate libexec/"gsd-agent.yaml", :exist?
    assert_predicate libexec/"skills", :directory?
  end
end
